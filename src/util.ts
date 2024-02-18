import jwt, { type JwtPayload } from 'jsonwebtoken'
import fetch from 'node-fetch'
import { createWriteStream, promises as nodeFs } from 'node:fs'
import nodePath from 'node:path'
import { setTimeout } from 'node:timers/promises'
import simpleGit, { SimpleGit } from 'simple-git'
import TsResult, { Result } from 'ts-results'
import yauzl from 'yauzl'

import { RngoOptions } from './rngo'

const { Err, Ok } = TsResult

export type InitError =
  | {
      code: 'invalidOption'
      key: keyof RngoOptions
      message: string
    }
  | {
      code: 'missingOption'
      key: keyof RngoOptions
      message: string
    }
  | {
      code: 'invalidConfig'
      path: (string | number)[]
      message: string
    }

export type ValidJwtToken = { token: string; expirationDate: Date }
export type JwtTokenError = 'missing' | 'expired' | 'malformed'

export function resolveApiUrl(
  apiUrl: string | undefined
): Result<URL, InitError> {
  let rawUrl = apiUrl || process.env['RNGO_API_URL'] || 'https://api.rngo.dev'

  if (!rawUrl.endsWith('/graphql')) {
    rawUrl = rawUrl.endsWith('/') ? `${rawUrl}graphql` : `${rawUrl}/graphql`
  }

  try {
    return Ok(new URL(rawUrl))
  } catch (error) {
    const key = apiUrl ? 'apiUrl' : 'RNGO_API_URL'
    return Err({
      code: 'invalidOption',
      key: 'apiUrl',
      message: `Error parsing ${key} value '${rawUrl}': ${error}`,
    })
  }
}

export async function downloadUrl(
  url: string,
  directory: string
): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`File download failed: ${response.status} ${url}`)
  }

  const filepath = filePathForUrl(url, directory)
  const directoryExists = await fileExists(nodePath.dirname(filepath))

  if (!directoryExists) {
    await nodeFs.mkdir(nodePath.dirname(filepath), { recursive: true })
  }

  const writer = createWriteStream(filepath)
  response.body!.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filepath))
    writer.on('error', reject)
  })
}

export function filePathForUrl(url: string, directory: string) {
  const urlPath = new URL(url).pathname

  let largestPrefix = ''
  for (let i = 1; i < urlPath.length; i++) {
    const prefix = urlPath.substring(0, i)
    if (directory.indexOf(prefix) > -1) {
      largestPrefix = prefix
    }
  }

  const relativeUrlPath = urlPath.replace(largestPrefix, '')

  return nodePath.format({
    dir: nodePath.join(directory, nodePath.dirname(relativeUrlPath)),
    base: nodePath.basename(relativeUrlPath),
  })
}

export function parseJwtToken(
  token: string | undefined
): Result<ValidJwtToken, JwtTokenError> {
  if (token) {
    const decodedJwt = jwt.decode(token) as JwtPayload

    if (decodedJwt.exp) {
      const expirationDate = new Date(decodedJwt.exp * 1000)

      if (expirationDate > new Date()) {
        return Ok({ token: token, expirationDate })
      } else {
        return Err('expired')
      }
    } else {
      return Err('malformed')
    }
  } else {
    return Err('missing')
  }
}

export async function poll<T>(thunk: () => Promise<T>): Promise<T | undefined> {
  let value

  for (let i = 0; i < 60; i++) {
    value = await thunk()

    if (value) {
      break
    } else {
      await setTimeout(500)
    }
  }

  return value
}

export async function fileExists(path: string): Promise<boolean> {
  return nodeFs
    .stat(path)
    .then(() => true)
    .catch((error) => {
      if (error.code === 'ENOENT') {
        return false
      } else {
        throw error
      }
    })
}

export async function symlinkExists(path: string): Promise<boolean> {
  return nodeFs
    .lstat(path)
    .then((stat) => stat.isSymbolicLink())
    .catch((error) => {
      if (error.code === 'ENOENT') {
        return false
      } else {
        throw error
      }
    })
}

export async function readFile(path: string): Promise<string | undefined> {
  return nodeFs
    .readFile(path, {
      encoding: 'utf8',
    })
    .catch((error) => {
      if (error.code === 'ENOENT') {
        return undefined
      } else {
        throw error
      }
    })
}

export async function writeFile(path: string, content: string): Promise<void> {
  await nodeFs.mkdir(nodePath.dirname(path), { recursive: true })
  await nodeFs.writeFile(path, content)
}

interface ScmRepo {
  type: 'git'
  name: string
  branch: string
  commitHash: string
}

export async function maybeGit(): Promise<SimpleGit | undefined> {
  const git = simpleGit()

  if (await git.checkIsRepo()) {
    return git
  }
}

export async function getScmRepo(): Promise<ScmRepo | undefined> {
  const git = await maybeGit()

  if (git) {
    const repoPath = await git.revparse(['--show-toplevel'])
    const branch = await git.revparse(['--abbrev-ref', 'HEAD'])
    const commitHash = await git.revparse(['HEAD'])

    return {
      type: 'git',
      name: repoPath.split('/').pop()!,
      branch,
      commitHash,
    }
  }
}

export async function unzip(
  zipPath: string,
  destination: string
): Promise<void> {
  yauzl.open(zipPath, { lazyEntries: true }, function (err, zipFile) {
    if (err) throw err
    zipFile.readEntry()

    zipFile.on('entry', async (entry) => {
      if (entry.fileName.endsWith('/')) {
        // Directory
        await nodeFs.mkdir(`${destination}/${entry.fileName}`, {
          recursive: true,
        })
        zipFile.readEntry()
      } else {
        // File
        zipFile.openReadStream(entry, async (err, readStream) => {
          if (err) throw err

          readStream.on('end', () => {
            zipFile.readEntry()
          })

          const entryOutputDir = nodePath.join(
            destination,
            nodePath.dirname(entry.fileName)
          )

          const exists = await fileExists(entryOutputDir)
          if (!exists) {
            await nodeFs.mkdir(entryOutputDir, { recursive: true })
          }

          const outFile = await nodeFs.open(
            `${destination}/${entry.fileName}`,
            'w'
          )
          readStream.pipe(outFile.createWriteStream())
        })
      }
    })
  })
}
