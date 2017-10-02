#### 서버 기동
1. ui 모드: ```pm2 start gekko.js -f --name ui -x -- --ui --config config.js```
2. trade 모드: ```pm2 start gekko.js -f --name trade -x -- --config config.js```
3. ```pm2 start gekko.js -f --name ui -i 0 -- --ui --config config.js```

#### 주소 
1. http://174.138.41.140:3000/
2. ssh root@174.138.41.140 !@qq0*******

#### sqlite to postgres
1. web/vue/UIConfig.js 수정
2. config.js
   - config.adpater 수정


