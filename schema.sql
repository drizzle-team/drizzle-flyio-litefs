create table if not exists users (
  id integer primary key,
  name text not null,
  email text not null
);