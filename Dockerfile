FROM ubuntu:latest
LABEL authors="giova"

ENTRYPOINT ["top", "-b"]