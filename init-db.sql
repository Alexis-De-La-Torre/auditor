create database auditor;

create table branches(
    id serial primary key,
    name text not null
);

insert into branches values (1, 'Tijuana Sur');
insert into branches values (2, 'Mexicali Norte');
insert into branches values (3, 'Mexicali Centro');

create table users(
    id serial primary key,
    permissions text not null,
    branch_id int references branches(id),
    email text not null,
    hash text not null,
    job text not null
);

-- contrasena para todos = "secreto"

insert into users values (
    1,
    'op',
    null,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Jefe de Operaciones'
);

insert into users values (
    2,
    'conta',
    null,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Jefe de Contabilidad'
);

insert into users values (
    3,
    'conta.aux',
    null,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Auxiliar de Contabilidad'
);

insert into users values (
    4,
    'geren',
    1,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Gerente'
);

insert into users values (
    5,
    'geren',
    2,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Gerente'
);

insert into users values (
    6,
    'geren',
    3,
    '',
    'df733656293a19c54f69093ba916f0a1a2a3c151fc95c13f3a794c2631eeb3a6',
    'Gerente'
);

create table audits(
    id serial primary key,
    reception_date date not null,
    sale_date date not null,
    deposit_number text not null,
    branch_id int references branches(id),
    currency text not null,
    amount numeric not null,
    diff numeric not null,
    bank_account text not null,
    notes text not null,
    audit_file text not null,
    problem_type text,
    extra_info text,
    closing_date date,
    closing_reason text,
    closing_notes text,
    signed_discount_file text,
    deposit_voucher text,
    withdrawals_report text,
    staff_checks text,
    status text not null
);

-- DOWN ----------------------------------
--drop table audits; 
--drop table users;
--drop table branches;