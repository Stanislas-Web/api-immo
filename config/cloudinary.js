const { v2: cloudinary } = require('cloudinary');

// Configuration de Cloudinary avec les valeurs directes
cloudinary.config({
    cloud_name: 'deb9kfhnx',
    api_key: '361696961216527',
    api_secret: 'lFU4XdFGVAanX1Cg7tgY0F4wmUw'
});

module.exports = cloudinary;
