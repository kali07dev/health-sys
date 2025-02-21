## To SetUP ENV

- Make Sure You create A Config.yaml file, copy from the example.yaml file and modify to match env of your DB, don't change the Logging values


## Database Config:
- Make sure to run the cmd in your PSQL Db 
    -> CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    to fix migration error if it arises

## To Run Migrations 
- >go run main.go migrate

## To Run Server 
- >go run main.go server

## To create Admin Account
go run main.go create-admin -e email@example.com -p password -f John -l Doek