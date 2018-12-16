# node_redis_cache_and_search_demo
A node app to demonstrate Caching of JSON object as HASH and use FT.ADDHASH then FT.SEARCH

Install with:

    npm install redis
    npm install axios
    npm install response-time
    npm install express

## Usage Example

```
Start or connect to a Redis DB with Search module (FT)
e.g. redismod is quick and easy to start
docker run -p 6379:6379 redislabs/redismod

Start the node app
node vehicle_cache_server.js

Open a browser or postman etc to execute the search query for a given vehicle type and year
http://localhost:3000/api/search?make=merc&year=2018

First query takes a long time
"source": "National Highway Traffic Safety Administration Vehicle API"
X-Response-Time →955.849ms

Second query is much faster because we are retrieving the value from Redis
"{\"source\":\"Redis Cache\"
X-Response-Time →1.733ms

Now, we have the cached the JSON response as HASH in Redis so, let's Connect to redis-cli and build a searchable index.
127.0.0.1:6379> KEYS *
1) "vehicle:merc:2018"
127.0.0.1:6379> type "vehicle:merc:2018"
hash

Create an index with the given spec.
127.0.0.1:6379> FT.CREATE "vehicle:merc:2018" SCHEMA RedisCacheResponse TEXT SORTABLE
OK

Adds a document to the index from an existing HASH key in Redis.
127.0.0.1:6379> FT.ADDHASH "vehicle:merc:2018" "vehicle:merc:2018" 0.5 LANGUAGE german REPLACE
OK

127.0.0.1:6379> KEYS *
  1) "ft:vehicle:merc:2018/53"
  2) "ft:vehicle:merc:2018/14090"
  3) "ft:vehicle:merc:2018/945"
  4) "ft:vehicle:merc:2018/5304"
  5) "ft:vehicle:merc:2018/12176"
  .......
 
127.0.0.1:6379> type "idx:vehicle:merc:2018"
ft_index0
127.0.0.1:6379> type "ft:vehicle:merc:2018/53"
ft_invidx 

127.0.0.1:6379> FT.MGET vehicle:merc:2018 vehicle:merc:2018
1) 1) "RedisCacheResponse"
   2) "{\"source\":\"Redis Cache\",\"Count\":53,\"Message\":\"Results returned successfully\",\"SearchCriteria\":\"Make:merc | ModelYear:2018\",\"Results\":[{\"Make_ID\":8959,\"Make_Name\":\"Bivouac Commercial Vehicles\",\"Model_ID\":23086,\"Model_Name\":\"Bivouac Commercial Vehicles\"},....
   ..........

HIGHLIGHT ...: This option to format occurrences of matched text.
127.0.0.1:6379> FT.SEARCH vehicle:merc:2018 "commercial" HIGHLIGHT
1) (integer) 1
2) "vehicle:merc:2018"
3) 1) "RedisCacheResponse"
   2) "{\"source\":\"Redis Cache\",\"Count\":53,\"Message\":\"Results returned successfully\",\"SearchCriteria\":\"Make:merc | ModelYear:2018\",\"Results\":[{\"Make_ID\":8959,\"Make_Name\":\"Bivouac <b>Commercial</b> Vehicles\",\"Model_ID\":23086,\"Model_Name\":\"Bivouac <b>Commercial</b> Vehicles\"},{\"Make_ID\":5416,\"Make_Name\":\"Ca. <b>Commercial</b> Trailer\",\"Model_ID\":13984,\"Model_Name\":\"Ca. <b>Commercial</b>.................
   ............

SUMMARIZE ...: This option to return only the sections of the field which contain the matched text.
127.0.0.1:6379> FT.SEARCH vehicle:merc:2018 "commercial" SUMMARIZE
1) (integer) 1
2) "vehicle:merc:2018"
3) 1) "RedisCacheResponse"
   2) "Bivouac Commercial Vehicles\",\"Model_ID\":23086,\"Model_Name\":\"Bivouac Commercial Vehicles\"},{\"Make_ID\":5416,\"Make_Name\":\"Ca. Commercial Trailer\",\"Model_ID\":13984,\"Model_Name\":\"Ca. Commercial Trailer... Commercial Manufacturing & Industrial, Co.\",\"Model_ID\":22093,\"Model_Name\":\"Commercial Manufacturing & Industrial, Co.\"},{\"Make_ID\":7008,\"Make_Name\":\"Commercial Mobile Systems\",\"Model_ID\":18630,\"Model_Name\":\"Commercial Office\"},{\"Make_ID\":5804,\"Make_Name\":\"Commercial Structures \",\"Model_ID\":15189,\"Model_Name\":\"Commercial Structures Trailer \"},{\"Make_ID\":1820,\"Make_Name\":\"COMMERCIAL TRAILER\",\"Model_ID\":5304,\"Model_Name\":\"COMMERCIAL TRAILER\"},{\"Make_ID\":9539,\"Make_Name\":\"Commercial Vehicles CV\",\"Model_ID\":23847,\"Model_Name\":\"Commercial Vehicles CV\"},{\"Make_ID\":1383,\"Make_Name\":\"DaimlerChrysler Commercial... Orion II\"},{\"Make_ID\":1383,\"Make_Name\":\"DaimlerChrysler Commercial Bus\",\"Model_ID\":4732,\"Model_Name\":\"Orion V\"},{\"Make_ID... "   

FT.SEARCH vehicle:merc:2018 "make" OR FT.SEARCH vehicle:merc:2018 "*" will return the complete JSON as blob of text.
```
Visit https://oss.redislabs.com/redisearch/ for RediSearch documentation, usage, clients etc.
