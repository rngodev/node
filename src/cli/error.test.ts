import { arrayToJsonPath, jsonPathToArray } from './error'

describe('arrayToJsonPath', () => {
  test('only object fields', () => {
    expect(arrayToJsonPath(['a', 'b'])).toBe('a.b')
  })

  test('object fields and array indexes', () => {
    expect(arrayToJsonPath(['a', '0', 'b', '1'])).toBe('a[0].b[1]')
  })
})

describe('jsonPathToArray', () => {
  test('only object fields', () => {
    expect(jsonPathToArray('a.b')).toEqual(['a', 'b'])
  })

  test('object fields and array indexes', () => {
    expect(jsonPathToArray('a[0].b[1]')).toEqual(['a', '0', 'b', '1'])
  })
})
