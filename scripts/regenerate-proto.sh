protoc -I src/protos/ src/protos/rpc.proto --go_out=plugins=grpc:$GOPATH/src/github.com/lightningnetwork/lnd/pine/rpc
