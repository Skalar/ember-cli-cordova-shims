export default function(name, src){
  Em.Logger.warn("Missing Cordova Plugin: "+name+"\n"+
                 "Install with: cordova plugin add "+src);
}
