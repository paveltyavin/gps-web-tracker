define('config', [], function(){
  return {
    serverUrl:'http://example.com', // without appending slash
    browserPort:'8020',
    yandexApiKey:'Your-key-here',
    pointTTL:3e5, // 3e5 = 5 minutes
    pointCheckTime:6e4 // 6e4 = minute
  }
});