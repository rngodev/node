export enum PostgresDataType {
  SMALLINT = 'SMALLINT',
  INTEGER = 'INTEGER',
  BIGINT = 'BIGINT',
  DECIMAL = 'DECIMAL',
  NUMERIC = 'NUMERIC',
  REAL = 'REAL',
  DOUBLE_PRECISION = 'DOUBLE PRECISION',
  SERIAL = 'SERIAL',
  BIGSERIAL = 'BIGSERIAL',
  TIMESTAMP = 'TIMESTAMP',
  TIMESTAMPTZ = 'TIMESTAMPTZ',
  DATE = 'DATE',
  TIME = 'TIME',
  BOOLEAN = 'BOOLEAN',
  CHAR = 'CHAR',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  ENUM = 'ENUM',
  UUID = 'UUID',
  JSON = 'JSON',
  JSONB = 'JSONB',
  ARRAY = 'ARRAY',
  USER_DEFINED = 'USER-DEFINED',
  UNKNOWN = 'UNKNOWN',
}

export const TypeMaps: {
  postgresType: PostgresDataType
  dataTypes: string[]
  udtNames: string[]
}[] = [
  {
    postgresType: PostgresDataType.ARRAY,
    dataTypes: ['ARRAY'],
    udtNames: [],
  },
  {
    postgresType: PostgresDataType.BIGINT,
    dataTypes: ['bigint'],
    udtNames: ['int8'],
  },
  {
    postgresType: PostgresDataType.INTEGER,
    dataTypes: ['integer'],
    udtNames: ['int4'],
  },
  {
    postgresType: PostgresDataType.SMALLINT,
    dataTypes: ['smallint'],
    udtNames: ['int2'],
  },
  {
    postgresType: PostgresDataType.TEXT,
    dataTypes: ['text'],
    udtNames: ['text'],
  },
  {
    postgresType: PostgresDataType.TIMESTAMPTZ,
    dataTypes: ['timestamp with time zone'],
    udtNames: ['timestamptz'],
  },
  {
    postgresType: PostgresDataType.USER_DEFINED,
    dataTypes: ['USER-DEFINED'],
    udtNames: [],
  },
]

export function parsePostgresDataType(
  dataType: string
): PostgresDataType | undefined {
  const typeMap = TypeMaps.find((typeMap) =>
    typeMap.dataTypes.includes(dataType)
  )
  return typeMap?.postgresType
}

export function parseUdtName(udtName: string): PostgresDataType | undefined {
  const typeMap = TypeMaps.find((typeMap) =>
    typeMap.udtNames.includes(normalizeUdtName(udtName))
  )
  return typeMap?.postgresType
}

export function normalizeUdtName(name: string) {
  return name.replace(/^_+/, '')
}
