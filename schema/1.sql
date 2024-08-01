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
    tstz timestamptz
);

CREATE TABLE b (
    aid bigint REFERENCES a(id) NOT NULL
);
