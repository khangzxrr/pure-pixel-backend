--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE sftpgo;




--
-- Drop roles
--

DROP ROLE postgres;


--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:RTAGx7EXC5VKIvTEq3CKmw==$ZO+oWtW4tdaviZ3qpTFkXUwqYUHDYkh9W6xFFOycF4g=:qUM0GrlZZF3pkyTdb033VgrOfrgPccWRGQfIVSR7/1I=';

--
-- User Configurations
--








--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+1)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO postgres;

\connect template1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\connect template1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: postgres
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+1)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO postgres;

\connect postgres

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_transfers (
    id bigint NOT NULL,
    connection_id character varying(100) NOT NULL,
    transfer_id bigint NOT NULL,
    transfer_type integer NOT NULL,
    username character varying(255) NOT NULL,
    folder_name character varying(255),
    ip character varying(50) NOT NULL,
    truncated_size bigint NOT NULL,
    current_ul_size bigint NOT NULL,
    current_dl_size bigint NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.active_transfers OWNER TO postgres;

--
-- Name: active_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.active_transfers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.active_transfers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    description character varying(512),
    password character varying(255) NOT NULL,
    email character varying(255),
    status integer NOT NULL,
    permissions text NOT NULL,
    filters text,
    additional_info text,
    last_login bigint NOT NULL,
    role_id integer,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_groups_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins_groups_mapping (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    group_id integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.admins_groups_mapping OWNER TO postgres;

--
-- Name: admins_groups_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admins_groups_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admins_groups_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admins ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    key_id character varying(50) NOT NULL,
    api_key character varying(255) NOT NULL,
    scope integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    last_use_at bigint NOT NULL,
    expires_at bigint NOT NULL,
    description text,
    admin_id integer,
    user_id integer
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.api_keys ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configurations (
    id integer NOT NULL,
    configs text NOT NULL
);


ALTER TABLE public.configurations OWNER TO postgres;

--
-- Name: configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.configurations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: defender_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.defender_events (
    id bigint NOT NULL,
    date_time bigint NOT NULL,
    score integer NOT NULL,
    host_id bigint NOT NULL
);


ALTER TABLE public.defender_events OWNER TO postgres;

--
-- Name: defender_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.defender_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.defender_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: defender_hosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.defender_hosts (
    id bigint NOT NULL,
    ip character varying(50) NOT NULL,
    ban_time bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.defender_hosts OWNER TO postgres;

--
-- Name: defender_hosts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.defender_hosts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.defender_hosts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events_actions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    type integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.events_actions OWNER TO postgres;

--
-- Name: events_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events_actions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status integer NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    trigger integer NOT NULL,
    conditions text NOT NULL,
    deleted_at bigint NOT NULL
);


ALTER TABLE public.events_rules OWNER TO postgres;

--
-- Name: events_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events_rules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    path text,
    used_quota_size bigint NOT NULL,
    used_quota_files integer NOT NULL,
    last_quota_update bigint NOT NULL,
    filesystem text
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.folders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.folders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    user_settings text
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_folders_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups_folders_mapping (
    id integer NOT NULL,
    group_id integer NOT NULL,
    folder_id integer NOT NULL,
    virtual_path text NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL
);


ALTER TABLE public.groups_folders_mapping OWNER TO postgres;

--
-- Name: groups_folders_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.groups_folders_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.groups_folders_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.groups ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ip_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ip_lists (
    id bigint NOT NULL,
    type integer NOT NULL,
    ipornet character varying(50) NOT NULL,
    mode integer NOT NULL,
    description character varying(512),
    first inet NOT NULL,
    last inet NOT NULL,
    ip_type integer NOT NULL,
    protocols integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    deleted_at bigint NOT NULL
);


ALTER TABLE public.ip_lists OWNER TO postgres;

--
-- Name: ip_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ip_lists ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ip_lists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nodes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    data text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.nodes OWNER TO postgres;

--
-- Name: nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nodes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rules_actions_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rules_actions_mapping (
    id integer NOT NULL,
    rule_id integer NOT NULL,
    action_id integer NOT NULL,
    "order" integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.rules_actions_mapping OWNER TO postgres;

--
-- Name: rules_actions_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.rules_actions_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rules_actions_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_version (
    id integer NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public.schema_version OWNER TO postgres;

--
-- Name: schema_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.schema_version ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.schema_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shared_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shared_sessions (
    key character varying(128) NOT NULL,
    data text NOT NULL,
    type integer NOT NULL,
    "timestamp" bigint NOT NULL
);


ALTER TABLE public.shared_sessions OWNER TO postgres;

--
-- Name: shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shares (
    id integer NOT NULL,
    share_id character varying(60) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    scope integer NOT NULL,
    paths text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    last_use_at bigint NOT NULL,
    expires_at bigint NOT NULL,
    password text,
    max_tokens integer NOT NULL,
    used_tokens integer NOT NULL,
    allow_from text,
    user_id integer NOT NULL
);


ALTER TABLE public.shares OWNER TO postgres;

--
-- Name: shares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.shares ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    updated_at bigint NOT NULL,
    version bigint NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    status integer NOT NULL,
    expiration_date bigint NOT NULL,
    description character varying(512),
    password text,
    public_keys text,
    home_dir text NOT NULL,
    uid bigint NOT NULL,
    gid bigint NOT NULL,
    max_sessions integer NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL,
    permissions text NOT NULL,
    used_quota_size bigint NOT NULL,
    used_quota_files integer NOT NULL,
    last_quota_update bigint NOT NULL,
    upload_bandwidth integer NOT NULL,
    download_bandwidth integer NOT NULL,
    last_login bigint NOT NULL,
    filters text,
    filesystem text,
    additional_info text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    email character varying(255),
    upload_data_transfer integer NOT NULL,
    download_data_transfer integer NOT NULL,
    total_data_transfer integer NOT NULL,
    used_upload_data_transfer bigint NOT NULL,
    used_download_data_transfer bigint NOT NULL,
    deleted_at bigint NOT NULL,
    first_download bigint NOT NULL,
    first_upload bigint NOT NULL,
    last_password_change bigint NOT NULL,
    role_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_folders_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_folders_mapping (
    id integer NOT NULL,
    virtual_path text NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL,
    folder_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.users_folders_mapping OWNER TO postgres;

--
-- Name: users_folders_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_folders_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_folders_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_groups_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_groups_mapping (
    id integer NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    group_type integer NOT NULL
);


ALTER TABLE public.users_groups_mapping OWNER TO postgres;

--
-- Name: users_groups_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_groups_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_groups_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: active_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.active_transfers (id, connection_id, transfer_id, transfer_type, username, folder_name, ip, truncated_size, current_ul_size, current_dl_size, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, username, description, password, email, status, permissions, filters, additional_info, last_login, role_id, created_at, updated_at) FROM stdin;
1	admin	behold! this is our ADMIN!	$2a$10$IsQcxZTZs1X8qOcElBYNDeZ2jYQC1a89Uu8AZWjqs1qVNpP79EMUS	khangzxrr@gmail.com	1	["*"]	{"allow_api_key_auth":true,"require_two_factor":false,"totp_config":{"secret":{}},"preferences":{}}		1726085190955	\N	1726085190951	1726085212797
\.


--
-- Data for Name: admins_groups_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins_groups_mapping (id, admin_id, group_id, options) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_keys (id, name, key_id, api_key, scope, created_at, updated_at, last_use_at, expires_at, description, admin_id, user_id) FROM stdin;
\.


--
-- Data for Name: configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configurations (id, configs) FROM stdin;
1	{}
\.


--
-- Data for Name: defender_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.defender_events (id, date_time, score, host_id) FROM stdin;
\.


--
-- Data for Name: defender_hosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.defender_hosts (id, ip, ban_time, updated_at) FROM stdin;
\.


--
-- Data for Name: events_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events_actions (id, name, description, type, options) FROM stdin;
\.


--
-- Data for Name: events_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events_rules (id, name, status, description, created_at, updated_at, trigger, conditions, deleted_at) FROM stdin;
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folders (id, name, description, path, used_quota_size, used_quota_files, last_quota_update, filesystem) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, description, created_at, updated_at, user_settings) FROM stdin;
\.


--
-- Data for Name: groups_folders_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups_folders_mapping (id, group_id, folder_id, virtual_path, quota_size, quota_files) FROM stdin;
\.


--
-- Data for Name: ip_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ip_lists (id, type, ipornet, mode, description, first, last, ip_type, protocols, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nodes (id, name, data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rules_actions_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rules_actions_mapping (id, rule_id, action_id, "order", options) FROM stdin;
\.


--
-- Data for Name: schema_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_version (id, version) FROM stdin;
1	29
\.


--
-- Data for Name: shared_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shared_sessions (key, data, type, "timestamp") FROM stdin;
\.


--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shares (id, share_id, name, description, scope, paths, created_at, updated_at, last_use_at, expires_at, password, max_tokens, used_tokens, allow_from, user_id) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, name, updated_at, version) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, status, expiration_date, description, password, public_keys, home_dir, uid, gid, max_sessions, quota_size, quota_files, permissions, used_quota_size, used_quota_files, last_quota_update, upload_bandwidth, download_bandwidth, last_login, filters, filesystem, additional_info, created_at, updated_at, email, upload_data_transfer, download_data_transfer, total_data_transfer, used_upload_data_transfer, used_download_data_transfer, deleted_at, first_download, first_upload, last_password_change, role_id) FROM stdin;
\.


--
-- Data for Name: users_folders_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_folders_mapping (id, virtual_path, quota_size, quota_files, folder_id, user_id) FROM stdin;
\.


--
-- Data for Name: users_groups_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_groups_mapping (id, user_id, group_id, group_type) FROM stdin;
\.


--
-- Name: active_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.active_transfers_id_seq', 1, false);


--
-- Name: admins_groups_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_groups_mapping_id_seq', 1, false);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, false);


--
-- Name: configurations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.configurations_id_seq', 1, true);


--
-- Name: defender_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.defender_events_id_seq', 1, false);


--
-- Name: defender_hosts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.defender_hosts_id_seq', 1, false);


--
-- Name: events_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_actions_id_seq', 1, false);


--
-- Name: events_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_rules_id_seq', 1, false);


--
-- Name: folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.folders_id_seq', 1, false);


--
-- Name: groups_folders_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_folders_mapping_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: ip_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ip_lists_id_seq', 1, false);


--
-- Name: nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nodes_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: rules_actions_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rules_actions_mapping_id_seq', 1, false);


--
-- Name: schema_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_version_id_seq', 1, true);


--
-- Name: shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shares_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: users_folders_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_folders_mapping_id_seq', 1, false);


--
-- Name: users_groups_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_groups_mapping_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: active_transfers active_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_transfers
    ADD CONSTRAINT active_transfers_pkey PRIMARY KEY (id);


--
-- Name: admins_groups_mapping admins_groups_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- Name: api_keys api_keys_key_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_id_key UNIQUE (key_id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: configurations configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_pkey PRIMARY KEY (id);


--
-- Name: defender_events defender_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_events
    ADD CONSTRAINT defender_events_pkey PRIMARY KEY (id);


--
-- Name: defender_hosts defender_hosts_ip_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_hosts
    ADD CONSTRAINT defender_hosts_ip_key UNIQUE (ip);


--
-- Name: defender_hosts defender_hosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_hosts
    ADD CONSTRAINT defender_hosts_pkey PRIMARY KEY (id);


--
-- Name: events_actions events_actions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_actions
    ADD CONSTRAINT events_actions_name_key UNIQUE (name);


--
-- Name: events_actions events_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_actions
    ADD CONSTRAINT events_actions_pkey PRIMARY KEY (id);


--
-- Name: events_rules events_rules_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_rules
    ADD CONSTRAINT events_rules_name_key UNIQUE (name);


--
-- Name: events_rules events_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_rules
    ADD CONSTRAINT events_rules_pkey PRIMARY KEY (id);


--
-- Name: folders folders_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_name_key UNIQUE (name);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: groups_folders_mapping groups_folders_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_pkey PRIMARY KEY (id);


--
-- Name: groups groups_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_name_key UNIQUE (name);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: ip_lists ip_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_lists
    ADD CONSTRAINT ip_lists_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_name_key UNIQUE (name);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rules_actions_mapping rules_actions_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_pkey PRIMARY KEY (id);


--
-- Name: schema_version schema_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_version
    ADD CONSTRAINT schema_version_pkey PRIMARY KEY (id);


--
-- Name: shared_sessions shared_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shared_sessions
    ADD CONSTRAINT shared_sessions_pkey PRIMARY KEY (key);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: shares shares_share_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_share_id_key UNIQUE (share_id);


--
-- Name: tasks tasks_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_name_key UNIQUE (name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: admins_groups_mapping unique_admin_group_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT unique_admin_group_mapping UNIQUE (admin_id, group_id);


--
-- Name: groups_folders_mapping unique_group_folder_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT unique_group_folder_mapping UNIQUE (group_id, folder_id);


--
-- Name: ip_lists unique_ipornet_type_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_lists
    ADD CONSTRAINT unique_ipornet_type_mapping UNIQUE (type, ipornet);


--
-- Name: rules_actions_mapping unique_rule_action_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT unique_rule_action_mapping UNIQUE (rule_id, action_id);


--
-- Name: users_folders_mapping unique_user_folder_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT unique_user_folder_mapping UNIQUE (user_id, folder_id);


--
-- Name: users_groups_mapping unique_user_group_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT unique_user_group_mapping UNIQUE (user_id, group_id);


--
-- Name: users_folders_mapping users_folders_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_pkey PRIMARY KEY (id);


--
-- Name: users_groups_mapping users_groups_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: active_transfers_connection_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_connection_id_idx ON public.active_transfers USING btree (connection_id);


--
-- Name: active_transfers_transfer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_transfer_id_idx ON public.active_transfers USING btree (transfer_id);


--
-- Name: active_transfers_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_updated_at_idx ON public.active_transfers USING btree (updated_at);


--
-- Name: admins_groups_mapping_admin_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_groups_mapping_admin_id_idx ON public.admins_groups_mapping USING btree (admin_id);


--
-- Name: admins_groups_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_groups_mapping_group_id_idx ON public.admins_groups_mapping USING btree (group_id);


--
-- Name: admins_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_role_id_idx ON public.admins USING btree (role_id);


--
-- Name: api_keys_admin_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_keys_admin_id_idx ON public.api_keys USING btree (admin_id);


--
-- Name: api_keys_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_keys_user_id_idx ON public.api_keys USING btree (user_id);


--
-- Name: defender_events_date_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_events_date_time_idx ON public.defender_events USING btree (date_time);


--
-- Name: defender_events_host_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_events_host_id_idx ON public.defender_events USING btree (host_id);


--
-- Name: defender_hosts_ban_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_hosts_ban_time_idx ON public.defender_hosts USING btree (ban_time);


--
-- Name: defender_hosts_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_hosts_updated_at_idx ON public.defender_hosts USING btree (updated_at);


--
-- Name: events_rules_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_deleted_at_idx ON public.events_rules USING btree (deleted_at);


--
-- Name: events_rules_trigger_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_trigger_idx ON public.events_rules USING btree (trigger);


--
-- Name: events_rules_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_updated_at_idx ON public.events_rules USING btree (updated_at);


--
-- Name: groups_folders_mapping_folder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX groups_folders_mapping_folder_id_idx ON public.groups_folders_mapping USING btree (folder_id);


--
-- Name: groups_folders_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX groups_folders_mapping_group_id_idx ON public.groups_folders_mapping USING btree (group_id);


--
-- Name: ip_lists_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_deleted_at_idx ON public.ip_lists USING btree (deleted_at);


--
-- Name: ip_lists_first_last_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_first_last_idx ON public.ip_lists USING btree (first, last);


--
-- Name: ip_lists_ipornet_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_ipornet_idx ON public.ip_lists USING btree (ipornet);


--
-- Name: ip_lists_ipornet_like_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_ipornet_like_idx ON public.ip_lists USING btree (ipornet varchar_pattern_ops);


--
-- Name: ip_lists_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_type_idx ON public.ip_lists USING btree (type);


--
-- Name: ip_lists_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_updated_at_idx ON public.ip_lists USING btree (updated_at);


--
-- Name: rules_actions_mapping_action_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_action_id_idx ON public.rules_actions_mapping USING btree (action_id);


--
-- Name: rules_actions_mapping_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_order_idx ON public.rules_actions_mapping USING btree ("order");


--
-- Name: rules_actions_mapping_rule_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_rule_id_idx ON public.rules_actions_mapping USING btree (rule_id);


--
-- Name: shared_sessions_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shared_sessions_timestamp_idx ON public.shared_sessions USING btree ("timestamp");


--
-- Name: shared_sessions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shared_sessions_type_idx ON public.shared_sessions USING btree (type);


--
-- Name: shares_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shares_user_id_idx ON public.shares USING btree (user_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_deleted_at_idx ON public.users USING btree (deleted_at);


--
-- Name: users_folders_mapping_folder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_folders_mapping_folder_id_idx ON public.users_folders_mapping USING btree (folder_id);


--
-- Name: users_folders_mapping_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_folders_mapping_user_id_idx ON public.users_folders_mapping USING btree (user_id);


--
-- Name: users_groups_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_mapping_group_id_idx ON public.users_groups_mapping USING btree (group_id);


--
-- Name: users_groups_mapping_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_mapping_user_id_idx ON public.users_groups_mapping USING btree (user_id);


--
-- Name: users_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_id_idx ON public.users USING btree (role_id);


--
-- Name: users_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_updated_at_idx ON public.users USING btree (updated_at);


--
-- Name: admins_groups_mapping admins_groups_mapping_admin_id_fk_admins_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_admin_id_fk_admins_id FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: admins_groups_mapping admins_groups_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: admins admins_role_id_fk_roles_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_role_id_fk_roles_id FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: api_keys api_keys_admin_id_fk_admins_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_admin_id_fk_admins_id FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: defender_events defender_events_host_id_fk_defender_hosts_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_events
    ADD CONSTRAINT defender_events_host_id_fk_defender_hosts_id FOREIGN KEY (host_id) REFERENCES public.defender_hosts(id) ON DELETE CASCADE;


--
-- Name: groups_folders_mapping groups_folders_mapping_folder_id_fk_folders_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_folder_id_fk_folders_id FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: groups_folders_mapping groups_folders_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: rules_actions_mapping rules_actions_mapping_action_id_fk_events_targets_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_action_id_fk_events_targets_id FOREIGN KEY (action_id) REFERENCES public.events_actions(id);


--
-- Name: rules_actions_mapping rules_actions_mapping_rule_id_fk_events_rules_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_rule_id_fk_events_rules_id FOREIGN KEY (rule_id) REFERENCES public.events_rules(id) ON DELETE CASCADE;


--
-- Name: shares shares_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_folders_mapping users_folders_mapping_folder_id_fk_folders_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_folder_id_fk_folders_id FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: users_folders_mapping users_folders_mapping_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_groups_mapping users_groups_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: users_groups_mapping users_groups_mapping_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fk_roles_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fk_roles_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

--
-- Database "sftpgo" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4 (Debian 16.4-1.pgdg120+1)
-- Dumped by pg_dump version 16.4 (Debian 16.4-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sftpgo; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE sftpgo WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE sftpgo OWNER TO postgres;

\connect sftpgo

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_transfers (
    id bigint NOT NULL,
    connection_id character varying(100) NOT NULL,
    transfer_id bigint NOT NULL,
    transfer_type integer NOT NULL,
    username character varying(255) NOT NULL,
    folder_name character varying(255),
    ip character varying(50) NOT NULL,
    truncated_size bigint NOT NULL,
    current_ul_size bigint NOT NULL,
    current_dl_size bigint NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.active_transfers OWNER TO postgres;

--
-- Name: active_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.active_transfers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.active_transfers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    description character varying(512),
    password character varying(255) NOT NULL,
    email character varying(255),
    status integer NOT NULL,
    permissions text NOT NULL,
    filters text,
    additional_info text,
    last_login bigint NOT NULL,
    role_id integer,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_groups_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins_groups_mapping (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    group_id integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.admins_groups_mapping OWNER TO postgres;

--
-- Name: admins_groups_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admins_groups_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admins_groups_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.admins ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    key_id character varying(50) NOT NULL,
    api_key character varying(255) NOT NULL,
    scope integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    last_use_at bigint NOT NULL,
    expires_at bigint NOT NULL,
    description text,
    admin_id integer,
    user_id integer
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.api_keys ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.api_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configurations (
    id integer NOT NULL,
    configs text NOT NULL
);


ALTER TABLE public.configurations OWNER TO postgres;

--
-- Name: configurations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.configurations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.configurations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: defender_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.defender_events (
    id bigint NOT NULL,
    date_time bigint NOT NULL,
    score integer NOT NULL,
    host_id bigint NOT NULL
);


ALTER TABLE public.defender_events OWNER TO postgres;

--
-- Name: defender_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.defender_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.defender_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: defender_hosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.defender_hosts (
    id bigint NOT NULL,
    ip character varying(50) NOT NULL,
    ban_time bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.defender_hosts OWNER TO postgres;

--
-- Name: defender_hosts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.defender_hosts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.defender_hosts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events_actions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    type integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.events_actions OWNER TO postgres;

--
-- Name: events_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events_actions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events_rules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    status integer NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    trigger integer NOT NULL,
    conditions text NOT NULL,
    deleted_at bigint NOT NULL
);


ALTER TABLE public.events_rules OWNER TO postgres;

--
-- Name: events_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events_rules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.folders (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    path text,
    used_quota_size bigint NOT NULL,
    used_quota_files integer NOT NULL,
    last_quota_update bigint NOT NULL,
    filesystem text
);


ALTER TABLE public.folders OWNER TO postgres;

--
-- Name: folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.folders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.folders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    user_settings text
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_folders_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups_folders_mapping (
    id integer NOT NULL,
    group_id integer NOT NULL,
    folder_id integer NOT NULL,
    virtual_path text NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL
);


ALTER TABLE public.groups_folders_mapping OWNER TO postgres;

--
-- Name: groups_folders_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.groups_folders_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.groups_folders_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.groups ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ip_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ip_lists (
    id bigint NOT NULL,
    type integer NOT NULL,
    ipornet character varying(50) NOT NULL,
    mode integer NOT NULL,
    description character varying(512),
    first inet NOT NULL,
    last inet NOT NULL,
    ip_type integer NOT NULL,
    protocols integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    deleted_at bigint NOT NULL
);


ALTER TABLE public.ip_lists OWNER TO postgres;

--
-- Name: ip_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ip_lists ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ip_lists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nodes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    data text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.nodes OWNER TO postgres;

--
-- Name: nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.nodes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.nodes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rules_actions_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rules_actions_mapping (
    id integer NOT NULL,
    rule_id integer NOT NULL,
    action_id integer NOT NULL,
    "order" integer NOT NULL,
    options text NOT NULL
);


ALTER TABLE public.rules_actions_mapping OWNER TO postgres;

--
-- Name: rules_actions_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.rules_actions_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rules_actions_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_version (
    id integer NOT NULL,
    version integer NOT NULL
);


ALTER TABLE public.schema_version OWNER TO postgres;

--
-- Name: schema_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.schema_version ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.schema_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shared_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shared_sessions (
    key character varying(128) NOT NULL,
    data text NOT NULL,
    type integer NOT NULL,
    "timestamp" bigint NOT NULL
);


ALTER TABLE public.shared_sessions OWNER TO postgres;

--
-- Name: shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shares (
    id integer NOT NULL,
    share_id character varying(60) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(512),
    scope integer NOT NULL,
    paths text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    last_use_at bigint NOT NULL,
    expires_at bigint NOT NULL,
    password text,
    max_tokens integer NOT NULL,
    used_tokens integer NOT NULL,
    allow_from text,
    user_id integer NOT NULL
);


ALTER TABLE public.shares OWNER TO postgres;

--
-- Name: shares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.shares ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    updated_at bigint NOT NULL,
    version bigint NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    status integer NOT NULL,
    expiration_date bigint NOT NULL,
    description character varying(512),
    password text,
    public_keys text,
    home_dir text NOT NULL,
    uid bigint NOT NULL,
    gid bigint NOT NULL,
    max_sessions integer NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL,
    permissions text NOT NULL,
    used_quota_size bigint NOT NULL,
    used_quota_files integer NOT NULL,
    last_quota_update bigint NOT NULL,
    upload_bandwidth integer NOT NULL,
    download_bandwidth integer NOT NULL,
    last_login bigint NOT NULL,
    filters text,
    filesystem text,
    additional_info text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    email character varying(255),
    upload_data_transfer integer NOT NULL,
    download_data_transfer integer NOT NULL,
    total_data_transfer integer NOT NULL,
    used_upload_data_transfer bigint NOT NULL,
    used_download_data_transfer bigint NOT NULL,
    deleted_at bigint NOT NULL,
    first_download bigint NOT NULL,
    first_upload bigint NOT NULL,
    last_password_change bigint NOT NULL,
    role_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_folders_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_folders_mapping (
    id integer NOT NULL,
    virtual_path text NOT NULL,
    quota_size bigint NOT NULL,
    quota_files integer NOT NULL,
    folder_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.users_folders_mapping OWNER TO postgres;

--
-- Name: users_folders_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_folders_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_folders_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_groups_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_groups_mapping (
    id integer NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    group_type integer NOT NULL
);


ALTER TABLE public.users_groups_mapping OWNER TO postgres;

--
-- Name: users_groups_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users_groups_mapping ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_groups_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: active_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.active_transfers (id, connection_id, transfer_id, transfer_type, username, folder_name, ip, truncated_size, current_ul_size, current_dl_size, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, username, description, password, email, status, permissions, filters, additional_info, last_login, role_id, created_at, updated_at) FROM stdin;
1	admin		$2a$10$B73mIKryrU2FdssRQA7mKOq3x7HgPK/BzB57mWsvxCZH3AkDdt81a		1	["*"]	{"allow_api_key_auth":true,"require_two_factor":false,"totp_config":{"secret":{}},"preferences":{}}		1726087012563	\N	1726086287438	1726086291982
\.


--
-- Data for Name: admins_groups_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins_groups_mapping (id, admin_id, group_id, options) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_keys (id, name, key_id, api_key, scope, created_at, updated_at, last_use_at, expires_at, description, admin_id, user_id) FROM stdin;
1	API key admin	qG9tozKGyjPjmy7R7wemJZ	$2a$10$qymufwXayoZi63nm33f9yuFdYI88MW2MD8i.cS.fgqrLEQQFTXX.a	1	1726087189694	1726087189694	0	0		1	\N
\.


--
-- Data for Name: configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configurations (id, configs) FROM stdin;
1	{}
\.


--
-- Data for Name: defender_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.defender_events (id, date_time, score, host_id) FROM stdin;
\.


--
-- Data for Name: defender_hosts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.defender_hosts (id, ip, ban_time, updated_at) FROM stdin;
\.


--
-- Data for Name: events_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events_actions (id, name, description, type, options) FROM stdin;
1	webhook		1	{"http_config":{"endpoint":"http://172.17.0.1:3001/sftpgo","password":{},"timeout":20,"skip_tls_verify":true,"method":"POST"},"cmd_config":{},"email_config":{},"retention_config":{},"fs_config":{"compress":{}},"pwd_expiration_config":{},"user_inactivity_config":{},"idp_config":{}}
\.


--
-- Data for Name: events_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events_rules (id, name, status, description, created_at, updated_at, trigger, conditions, deleted_at) FROM stdin;
\.


--
-- Data for Name: folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.folders (id, name, description, path, used_quota_size, used_quota_files, last_quota_update, filesystem) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, description, created_at, updated_at, user_settings) FROM stdin;
\.


--
-- Data for Name: groups_folders_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups_folders_mapping (id, group_id, folder_id, virtual_path, quota_size, quota_files) FROM stdin;
\.


--
-- Data for Name: ip_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ip_lists (id, type, ipornet, mode, description, first, last, ip_type, protocols, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nodes (id, name, data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rules_actions_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rules_actions_mapping (id, rule_id, action_id, "order", options) FROM stdin;
\.


--
-- Data for Name: schema_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_version (id, version) FROM stdin;
1	29
\.


--
-- Data for Name: shared_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shared_sessions (key, data, type, "timestamp") FROM stdin;
\.


--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shares (id, share_id, name, description, scope, paths, created_at, updated_at, last_use_at, expires_at, password, max_tokens, used_tokens, allow_from, user_id) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, name, updated_at, version) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, status, expiration_date, description, password, public_keys, home_dir, uid, gid, max_sessions, quota_size, quota_files, permissions, used_quota_size, used_quota_files, last_quota_update, upload_bandwidth, download_bandwidth, last_login, filters, filesystem, additional_info, created_at, updated_at, email, upload_data_transfer, download_data_transfer, total_data_transfer, used_upload_data_transfer, used_download_data_transfer, deleted_at, first_download, first_upload, last_password_change, role_id) FROM stdin;
1	user1	1	0		$2a$10$iCqSM00EP0Ku06cHoonAc.jV6K0j1/jKC872F6ET.GpY8Fq8AYkge	null	/temp/sftpgo/user1	0	0	0	0	0	{"/":["*"]}	0	0	0	0	0	1726086904321	{"hooks":{"external_auth_disabled":false,"pre_login_disabled":false,"check_password_disabled":false},"totp_config":{"secret":{}}}	{"provider":0,"osconfig":{},"s3config":{},"gcsconfig":{},"azblobconfig":{},"cryptconfig":{},"sftpconfig":{},"httpconfig":{}}		1726086638126	1726087056116		0	0	0	0	0	0	0	1726087111212	1726086638125	\N
\.


--
-- Data for Name: users_folders_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_folders_mapping (id, virtual_path, quota_size, quota_files, folder_id, user_id) FROM stdin;
\.


--
-- Data for Name: users_groups_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_groups_mapping (id, user_id, group_id, group_type) FROM stdin;
\.


--
-- Name: active_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.active_transfers_id_seq', 1, false);


--
-- Name: admins_groups_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_groups_mapping_id_seq', 1, false);


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, true);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 1, true);


--
-- Name: configurations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.configurations_id_seq', 1, true);


--
-- Name: defender_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.defender_events_id_seq', 1, false);


--
-- Name: defender_hosts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.defender_hosts_id_seq', 1, false);


--
-- Name: events_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_actions_id_seq', 1, true);


--
-- Name: events_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_rules_id_seq', 1, true);


--
-- Name: folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.folders_id_seq', 1, false);


--
-- Name: groups_folders_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_folders_mapping_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: ip_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ip_lists_id_seq', 1, false);


--
-- Name: nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nodes_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: rules_actions_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rules_actions_mapping_id_seq', 2, true);


--
-- Name: schema_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schema_version_id_seq', 1, true);


--
-- Name: shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shares_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: users_folders_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_folders_mapping_id_seq', 1, false);


--
-- Name: users_groups_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_groups_mapping_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: active_transfers active_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_transfers
    ADD CONSTRAINT active_transfers_pkey PRIMARY KEY (id);


--
-- Name: admins_groups_mapping admins_groups_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: api_keys api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_api_key_key UNIQUE (api_key);


--
-- Name: api_keys api_keys_key_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_id_key UNIQUE (key_id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: configurations configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_pkey PRIMARY KEY (id);


--
-- Name: defender_events defender_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_events
    ADD CONSTRAINT defender_events_pkey PRIMARY KEY (id);


--
-- Name: defender_hosts defender_hosts_ip_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_hosts
    ADD CONSTRAINT defender_hosts_ip_key UNIQUE (ip);


--
-- Name: defender_hosts defender_hosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_hosts
    ADD CONSTRAINT defender_hosts_pkey PRIMARY KEY (id);


--
-- Name: events_actions events_actions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_actions
    ADD CONSTRAINT events_actions_name_key UNIQUE (name);


--
-- Name: events_actions events_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_actions
    ADD CONSTRAINT events_actions_pkey PRIMARY KEY (id);


--
-- Name: events_rules events_rules_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_rules
    ADD CONSTRAINT events_rules_name_key UNIQUE (name);


--
-- Name: events_rules events_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events_rules
    ADD CONSTRAINT events_rules_pkey PRIMARY KEY (id);


--
-- Name: folders folders_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_name_key UNIQUE (name);


--
-- Name: folders folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);


--
-- Name: groups_folders_mapping groups_folders_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_pkey PRIMARY KEY (id);


--
-- Name: groups groups_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_name_key UNIQUE (name);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: ip_lists ip_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_lists
    ADD CONSTRAINT ip_lists_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_name_key UNIQUE (name);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rules_actions_mapping rules_actions_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_pkey PRIMARY KEY (id);


--
-- Name: schema_version schema_version_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_version
    ADD CONSTRAINT schema_version_pkey PRIMARY KEY (id);


--
-- Name: shared_sessions shared_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shared_sessions
    ADD CONSTRAINT shared_sessions_pkey PRIMARY KEY (key);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: shares shares_share_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_share_id_key UNIQUE (share_id);


--
-- Name: tasks tasks_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_name_key UNIQUE (name);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: admins_groups_mapping unique_admin_group_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT unique_admin_group_mapping UNIQUE (admin_id, group_id);


--
-- Name: groups_folders_mapping unique_group_folder_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT unique_group_folder_mapping UNIQUE (group_id, folder_id);


--
-- Name: ip_lists unique_ipornet_type_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_lists
    ADD CONSTRAINT unique_ipornet_type_mapping UNIQUE (type, ipornet);


--
-- Name: rules_actions_mapping unique_rule_action_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT unique_rule_action_mapping UNIQUE (rule_id, action_id);


--
-- Name: users_folders_mapping unique_user_folder_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT unique_user_folder_mapping UNIQUE (user_id, folder_id);


--
-- Name: users_groups_mapping unique_user_group_mapping; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT unique_user_group_mapping UNIQUE (user_id, group_id);


--
-- Name: users_folders_mapping users_folders_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_pkey PRIMARY KEY (id);


--
-- Name: users_groups_mapping users_groups_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: active_transfers_connection_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_connection_id_idx ON public.active_transfers USING btree (connection_id);


--
-- Name: active_transfers_transfer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_transfer_id_idx ON public.active_transfers USING btree (transfer_id);


--
-- Name: active_transfers_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX active_transfers_updated_at_idx ON public.active_transfers USING btree (updated_at);


--
-- Name: admins_groups_mapping_admin_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_groups_mapping_admin_id_idx ON public.admins_groups_mapping USING btree (admin_id);


--
-- Name: admins_groups_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_groups_mapping_group_id_idx ON public.admins_groups_mapping USING btree (group_id);


--
-- Name: admins_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admins_role_id_idx ON public.admins USING btree (role_id);


--
-- Name: api_keys_admin_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_keys_admin_id_idx ON public.api_keys USING btree (admin_id);


--
-- Name: api_keys_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_keys_user_id_idx ON public.api_keys USING btree (user_id);


--
-- Name: defender_events_date_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_events_date_time_idx ON public.defender_events USING btree (date_time);


--
-- Name: defender_events_host_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_events_host_id_idx ON public.defender_events USING btree (host_id);


--
-- Name: defender_hosts_ban_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_hosts_ban_time_idx ON public.defender_hosts USING btree (ban_time);


--
-- Name: defender_hosts_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX defender_hosts_updated_at_idx ON public.defender_hosts USING btree (updated_at);


--
-- Name: events_rules_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_deleted_at_idx ON public.events_rules USING btree (deleted_at);


--
-- Name: events_rules_trigger_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_trigger_idx ON public.events_rules USING btree (trigger);


--
-- Name: events_rules_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_rules_updated_at_idx ON public.events_rules USING btree (updated_at);


--
-- Name: groups_folders_mapping_folder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX groups_folders_mapping_folder_id_idx ON public.groups_folders_mapping USING btree (folder_id);


--
-- Name: groups_folders_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX groups_folders_mapping_group_id_idx ON public.groups_folders_mapping USING btree (group_id);


--
-- Name: ip_lists_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_deleted_at_idx ON public.ip_lists USING btree (deleted_at);


--
-- Name: ip_lists_first_last_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_first_last_idx ON public.ip_lists USING btree (first, last);


--
-- Name: ip_lists_ipornet_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_ipornet_idx ON public.ip_lists USING btree (ipornet);


--
-- Name: ip_lists_ipornet_like_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_ipornet_like_idx ON public.ip_lists USING btree (ipornet varchar_pattern_ops);


--
-- Name: ip_lists_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_type_idx ON public.ip_lists USING btree (type);


--
-- Name: ip_lists_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ip_lists_updated_at_idx ON public.ip_lists USING btree (updated_at);


--
-- Name: rules_actions_mapping_action_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_action_id_idx ON public.rules_actions_mapping USING btree (action_id);


--
-- Name: rules_actions_mapping_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_order_idx ON public.rules_actions_mapping USING btree ("order");


--
-- Name: rules_actions_mapping_rule_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX rules_actions_mapping_rule_id_idx ON public.rules_actions_mapping USING btree (rule_id);


--
-- Name: shared_sessions_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shared_sessions_timestamp_idx ON public.shared_sessions USING btree ("timestamp");


--
-- Name: shared_sessions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shared_sessions_type_idx ON public.shared_sessions USING btree (type);


--
-- Name: shares_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX shares_user_id_idx ON public.shares USING btree (user_id);


--
-- Name: users_deleted_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_deleted_at_idx ON public.users USING btree (deleted_at);


--
-- Name: users_folders_mapping_folder_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_folders_mapping_folder_id_idx ON public.users_folders_mapping USING btree (folder_id);


--
-- Name: users_folders_mapping_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_folders_mapping_user_id_idx ON public.users_folders_mapping USING btree (user_id);


--
-- Name: users_groups_mapping_group_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_mapping_group_id_idx ON public.users_groups_mapping USING btree (group_id);


--
-- Name: users_groups_mapping_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_groups_mapping_user_id_idx ON public.users_groups_mapping USING btree (user_id);


--
-- Name: users_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_id_idx ON public.users USING btree (role_id);


--
-- Name: users_updated_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_updated_at_idx ON public.users USING btree (updated_at);


--
-- Name: admins_groups_mapping admins_groups_mapping_admin_id_fk_admins_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_admin_id_fk_admins_id FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: admins_groups_mapping admins_groups_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins_groups_mapping
    ADD CONSTRAINT admins_groups_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: admins admins_role_id_fk_roles_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_role_id_fk_roles_id FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: api_keys api_keys_admin_id_fk_admins_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_admin_id_fk_admins_id FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: defender_events defender_events_host_id_fk_defender_hosts_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.defender_events
    ADD CONSTRAINT defender_events_host_id_fk_defender_hosts_id FOREIGN KEY (host_id) REFERENCES public.defender_hosts(id) ON DELETE CASCADE;


--
-- Name: groups_folders_mapping groups_folders_mapping_folder_id_fk_folders_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_folder_id_fk_folders_id FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: groups_folders_mapping groups_folders_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_folders_mapping
    ADD CONSTRAINT groups_folders_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: rules_actions_mapping rules_actions_mapping_action_id_fk_events_targets_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_action_id_fk_events_targets_id FOREIGN KEY (action_id) REFERENCES public.events_actions(id);


--
-- Name: rules_actions_mapping rules_actions_mapping_rule_id_fk_events_rules_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rules_actions_mapping
    ADD CONSTRAINT rules_actions_mapping_rule_id_fk_events_rules_id FOREIGN KEY (rule_id) REFERENCES public.events_rules(id) ON DELETE CASCADE;


--
-- Name: shares shares_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_folders_mapping users_folders_mapping_folder_id_fk_folders_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_folder_id_fk_folders_id FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;


--
-- Name: users_folders_mapping users_folders_mapping_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_folders_mapping
    ADD CONSTRAINT users_folders_mapping_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users_groups_mapping users_groups_mapping_group_id_fk_groups_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_group_id_fk_groups_id FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: users_groups_mapping users_groups_mapping_user_id_fk_users_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups_mapping
    ADD CONSTRAINT users_groups_mapping_user_id_fk_users_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fk_roles_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fk_roles_id FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database cluster dump complete
--

