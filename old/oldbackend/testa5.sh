ROUTE=$1
shift

echo "=====Testing production====="
curl -i "$@" "https://accounts5.roonlabs.com$ROUTE" | tee /dev/stderr | tail -n +1 | jq
echo ""
echo "=====Testing localhost====="
curl -i "$@" "http://localhost$ROUTE" | tee /dev/stderr | tail -n +1 | jq
