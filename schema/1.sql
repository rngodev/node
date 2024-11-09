CREATE TYPE role AS ENUM ('a', 'b');

CREATE TABLE a (
    id bigserial PRIMARY KEY,
    bintg bigint,
    intg int,
    sintg smallint,
    txt text,
    chr char(512),
    vchr varchar(255),
    bool boolean,
    ts timestamp,
    tstz timestamptz,
    json json,
    jsonb jsonb,
    enm role
);

CREATE TABLE b (
    aid bigint REFERENCES a(id) NOT NULL,
    bintg role[]
);
