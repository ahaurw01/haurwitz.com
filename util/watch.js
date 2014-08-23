var gaze = require('gaze'),
    spawn = require('child_process').spawn,
    serverProcess;

function attachListenersToProcess(proc, name) {
  proc.stdout.on('data', function(data) {
    console.log(['[', name, '] ', data].join(''));
  });
  proc.stderr.on('data', function(data) {
    console.log(['[', name, '] ', data].join(''));
  });
  proc.on('close', function(code) {
    console.log(['[', name, '] (closing code) ', code].join(''));
  });
}

// Start brunch watcher
attachListenersToProcess(spawn('./node_modules/.bin/brunch', ['watch'], {
  cwd: process.cwd()
}), 'brunch');


// Start server
function restartServer() {
  if (serverProcess) {
    serverProcess.kill();
  }
  serverProcess = spawn('node', ['server/app'], {
    cwd: process.cwd()
  });
  attachListenersToProcess(serverProcess, 'server');

}
restartServer();


// Watch blog posts
gaze('blog_posts/*.md', function () {
  // On changed/added/deleted
  this.on('all', function(event, filepath) {
    console.log(filepath + ' was ' + event);
    // Restart the server
    restartServer();
  });
});