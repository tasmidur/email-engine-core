#!/usr/bin/env bash
# wait-for-it.sh

set -e

TIMEOUT=15
QUIET=0

while [[ $# -gt 0 ]]
do
  key="$1"

  case $key in
      -q|--quiet)
      QUIET=1
      shift # past argument
      ;;
      -t|--timeout)
      TIMEOUT="$2"
      shift # past argument
      shift # past value
      ;;
      --)
      shift
      break
      ;;
      *)
      shift # past argument
      ;;
  esac
done

HOST="$1"
shift
PORT="$1"
shift
CMD="$@"

function log {
  if [ "$QUIET" -ne 1 ]; then echo "$1"; fi
}

log "Waiting for $HOST:$PORT..."

for i in `seq $TIMEOUT` ; do
  nc -z "$HOST" "$PORT" > /dev/null 2>&1
  result=$?
  if [ $result -eq 0 ] ; then
    log "$HOST:$PORT is available after $i seconds"
    exec $CMD
    exit 0
  fi
  sleep 1
done

log "$HOST:$PORT is not available after $TIMEOUT seconds"
exit 1
