import jwt, { type JwtPayload } from 'jsonwebtoken'
import fetch from 'node-fetch'
import { createWriteStream, promises as nodeFs } from 'node:fs'
import nodePath from 'node:path'
import { setTimeout } from 'node:timers/promises'
import simpleGit, { SimpleGit } from 'simple-git'
import TsResult, { Result } from 'ts-results'
import yauzl from 'yauzl'

const { Err, Ok } = TsResult

export type GeneralError = {
  code: 'general'
  message: string
}

export type InvalidConfigError = {
  code: 'invalidConfig'
  jsonPointer: string
  message: string
}

export type InvalidArgError<K extends string> = {
  code: 'invalidArg'
  key: K
  message: string
}

export type MissingArgError<K extends string> = {
  code: 'missingArg'
  key: K
  message: string
}

export type InsufficientVolumeError = {
  code: 'insufficientVolume'
  requiredUnits: number
  availableUnits: number
}

export type ValidJwtToken = { token: string; expirationDate: Date }
export type JwtTokenError = 'missing' | 'expired' | 'malformed'

export function resolveApiUrl(
  apiUrl: string | undefined
): Result<URL, InvalidArgError<'apiUrl'>> {
  let rawUrl = apiUrl || process.env['RNGO_API_URL'] || 'https://api.rngo.dev'

  if (!rawUrl.endsWith('/graphql')) {
    rawUrl = rawUrl.endsWith('/') ? `${rawUrl}graphql` : `${rawUrl}/graphql`
  }

  try {
    return Ok(new URL(rawUrl))
  } catch (error) {
    const key = apiUrl ? 'apiUrl' : 'RNGO_API_URL'
    return Err({
      code: 'invalidArg',
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

  const urlPathParts = new URL(url).pathname.split('/')
  const filePath = `${directory}/${urlPathParts[urlPathParts.length - 1]}`

  const directoryExists = await fileExists(nodePath.dirname(filePath))

  if (!directoryExists) {
    await nodeFs.mkdir(nodePath.dirname(filePath), { recursive: true })
  }

  const writer = createWriteStream(filePath)
  response.body!.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath))
    writer.on('error', reject)
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

export function buildJsonPointer(path: (string | number)[]): string {
  if (path.length === 0) {
    return ''
  } else {
    return '/' + path.join('/')
  }
}
