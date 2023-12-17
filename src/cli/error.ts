export type CliError = {
  path?: (string | number)[]
  message: string
}

export type ErrorCode =
  | 'ConfigInvalid'
  | 'LoginFailed'
  | 'RngoInitFailed'
  | 'SessionExpected'
  | 'SimTimedOut'
  | 'UnhandledError'
  | 'FlagInvalid'

export function arrayToJsonPath(array: (string | number)[]): string {
  return array.reduce<string>((path, value) => {
    let part

    if (/^([0-9]+)$/.test(value.toString())) {
      part = `[${value}]`
    } else if (path.length > 0) {
      part = `.${value}`
    } else {
      part = value
    }

    return path + part
  }, '')
}

export function jsonPathToArray(jsonPath: string): string[] {
  return jsonPath.split('.').flatMap((part) => {
    const match = /(.+)\[([0-9])\]/.exec(part)

    if (match) {
      return [match[1], match[2]]
    } else {
      return [part]
    }
  })
}

export function mapGqlValidationErrorsUntilMoreConsistent(
  errors?: CliError[]
): CliError[] {
  if (errors) {
    return errors.map((e) => {
      const parseErrorMatch = /parse error: (.*): (.*)/.exec(e.message)

      if (parseErrorMatch) {
        return {
          ...e,
          path: jsonPathToArray(parseErrorMatch[1]),
          message: parseErrorMatch[2],
        }
      } else {
        return e
      }
    })
  } else {
    return []
  }
}
