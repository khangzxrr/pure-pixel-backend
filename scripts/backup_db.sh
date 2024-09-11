cd ../docker/
sudo docker compose exec -T db pg_dumpall -c -U postgres >dump_db.sql
