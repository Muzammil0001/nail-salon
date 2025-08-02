export IMAGE_NAME="julietnails-master"
export CONTAINER_NAME="julietnails-master"
export TEMP_IMAGE_NAME="${CONTAINER_NAME}-backup"
export TEMP_CONTAINER_NAME="${CONTAINER_NAME}-temp"
export ENV="master"
export PORT="3000"

if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
    echo "Creating backup image and temporary container...";
    docker commit $CONTAINER_NAME $TEMP_IMAGE_NAME:temp &&
    docker stop $CONTAINER_NAME &&
    docker run --name=$TEMP_CONTAINER_NAME --restart always -p $PORT:$PORT -v /var/www/public:/var/www/public -d -t $TEMP_IMAGE_NAME:temp;
else
    echo "Main container not running. Skipping backup.";
fi

docker ps -a -q --filter "name=$CONTAINER_NAME" | grep -q . && docker rm $CONTAINER_NAME || echo "No old container to remove"

docker rmi $IMAGE_NAME:latest || echo "No old image to remove"
docker build --build-arg ENV=$ENV --build-arg PORT=$PORT -t $IMAGE_NAME:latest .  --progress=plain
 
docker ps -q --filter "name=$TEMP_CONTAINER_NAME" | grep -q . && docker stop $TEMP_CONTAINER_NAME || echo "No temp container to stop"
docker ps -a -q --filter "name=$TEMP_CONTAINER_NAME" | grep -q . && docker rm $TEMP_CONTAINER_NAME || echo "No temp container to remove"
docker images -q ${TEMP_IMAGE_NAME}:temp | grep -q . && docker rmi ${TEMP_IMAGE_NAME}:temp || echo "No temp image to remove"

docker run --name=$CONTAINER_NAME --restart always -p $PORT:$PORT -v /var/www/public:/var/www/public -d -t $IMAGE_NAME:latest
cp -rf public/* /var/www/public/
docker system prune -a -f
