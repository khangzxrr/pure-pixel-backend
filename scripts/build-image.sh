docker image rm khangzxrr/purepixel
docker buildx build --platform linux/amd64 -t khangzxrr/purepixel:latest .
docker push khangzxrr/purepixel:latest
