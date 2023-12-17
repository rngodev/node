import { configDocument } from './index'

test('configDocument must insert organizationId', () => {
  const doc = configDocument({
    organizationId: 'abc123',
    systemTypes: [],
  })

  expect(doc.toString()).toMatch(
    /^# To change organizations, run 'rngo org set'\norganizationId: abc123/
  )
})

test('configDocument must not include systems comment if no systems configured', () => {
  const doc = configDocument({
    organizationId: 'abc123',
    systemTypes: [],
  })

  expect(doc.toString()).not.toMatch(
    /# See https\:\/\/rngo.dev\/docs\/cli\/config for system config details/
  )
})

test('configDocument must include systems comment if systems configured', () => {
  const doc = configDocument({
    organizationId: 'abc123',
    systemTypes: ['postgres'],
  })

  expect(doc.toString()).toMatch(
    /# See https\:\/\/rngo.dev\/docs\/cli\/config for system config details/
  )
})

test('configDocument must include postgres system if included', () => {
  const doc = configDocument({
    organizationId: 'abc123',
    systemTypes: ['postgres'],
  })

  expect(doc.toString()).toContain(
    `postgres:
    type: postgres
    host:
      env: POSTGRES_HOST
      default: localhost
    port:
      env: POSTGRES_PORT
      default: 5432
    user:
      env: POSTGRES_USER
    password:
      env: POSTGRES_PASSWORD
    database:
      env: POSTGRES_DATABASE
    schema:
      env: POSTGRES_SCHEMA
      default: public`
  )
})

test('configDocument must include redis system if included', () => {
  const doc = configDocument({
    organizationId: 'abc123',
    systemTypes: ['redis'],
  })

  expect(doc.toString()).toContain(
    `redis:
    type: redis
    host:
      env: REDIS_HOST
      default: localhost
    port:
      env: REDIS_PORT
      default: 6379
    password:
      env: REDIS_PASSWORD`
  )
})
