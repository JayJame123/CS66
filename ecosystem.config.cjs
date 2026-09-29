module.exports = {
  apps: [
    {
      name: 'cs66',
      script: './scripts/serve-static.mjs',
      cwd: '/home/mio/Documents/CS66',
      env: {
        PORT: 3066,
        NODE_ENV: 'production'
      }
    }
  ]
};
