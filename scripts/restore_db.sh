cd ../docker
cat dump_db.sql | sudo docker compose exec -T db psql -U postgres
