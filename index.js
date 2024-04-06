const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
app.use(cors());

AWS.config.update({
    accessKeyId: 'DO009G8J4HEUMUWVJ4Q4',
    secretAccessKey: '+w9XGrS/zvMX6Z4mIk+cMkMTh2LtBApvYb8TfBWHOqs',
    region: 'blr1',
    endpoint: 'https://work-pool.blr1.digitaloceanspaces.com',
    s3ForcePathStyle: true,
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// const bucketName = 'ahec';

const uploadToS3 = (file, fileName,bucketName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ACL: 'public-read',
    };

    return s3.upload(params).promise();
};
app.post('/upload', upload.single('images'), async (req, res) => {
    try {
        const file = req.file;
        let convertedBuffer;
        let pathName;

        if (file.mimetype.startsWith('image')) {
            convertedBuffer = await sharp(file.buffer).webp().toBuffer();
        } else {
            convertedBuffer = file.buffer;
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileExtension1 = file.originalname
        const fileName = `file_${Date.now()}.${fileExtension.replace(/\s/g, '')}`;
        const {bucketName} = req.body
        const s3Response = await uploadToS3({ buffer: convertedBuffer }, fileName,bucketName);
        
        if (isValidURL(s3Response.Location)) {
         pathName = new URL(s3Response.Location).pathname;
        } else {
          pathName = s3Response.Location.split('.com/').pop()
        }
        res.json({ data:pathName.replace(/^\//, '') });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}
app.post('/multiple/upload', upload.array('images', 10), async (req, res) => {
        try {
            const files = req.files; 
            const {bucketName} = req.body
            const s3Responses = [];
    
            for (const file of files) {
                let convertedBuffer;
    
              
                if (file.mimetype.startsWith('image')) {
                    convertedBuffer = await sharp(file.buffer).webp().toBuffer();
                } else {
                 
                    convertedBuffer = file.buffer;
                }
    
               
                const fileExtension = file.originalname.split('.').pop();
                const fileName = `file_${Date.now()}.${fileExtension.replace(/\s/g, '')}`;
    
              
                const s3Response = await uploadToS3({ buffer: convertedBuffer }, fileName,bucketName);
                const pathOnly = new URL(s3Response.Location).pathname;
                s3Responses.push(pathOnly.replace(/^\//, ''));
            }
    
            res.json({ data: s3Responses });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error uploading files to S3' });
        }
    });

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
