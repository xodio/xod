FROM alpine:3.6
MAINTAINER XOD Developers <dev@xod.io>

WORKDIR /opt/
ADD dist/ ide/

# /opt/shared is a volume directory that should be mounted
# by an orchestrator
ENTRYPOINT ["sh", "-exc",  \
  "rm -rf /opt/shared/ide && cp -a ide/ /opt/shared && sleep 365d"]
