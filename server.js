const express = require('express')
const cors = require('cors')
const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')
require('dotenv').config();
//const rimraf = require('rimraf');

const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const https = require('https');

const app = express()
app.use(cors())

const PORT = 3000

let server = http.Server(app);

const config = require('./config/config');

const key = fs.readFileSync('./cert/' + config.SSL_KEY);
const cert = fs.readFileSync('./cert/' + config.SSL_CERT);
const ca = fs.readFileSync('./cert/' + config.SSL_CA);
let options = { key: key, cert: cert, ca: ca };
server = https.Server(options, app);
console.log(crypto.randomBytes(16).toJSON());
console.log(crypto.randomBytes(32).toJSON());
const initVector = Buffer.from(JSON.parse(config.INIT_VECTOR));
const Securitykey = Buffer.from(JSON.parse(config.SECURITY_KEY));


console.log("Running HTTPS");

app.use(bodyParser.json({ limit: '504mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public",express.static(path.join(__dirname, 'public')));

// app.use("/public", express.static("public"));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

//AWS s3
const AWS = require('aws-sdk');

//cconfigurar AWS con las claves de acceso
AWS.config.update({
    accessKeyId: config.KEY_ID,
    secretAccessKey: config.ACCESS_KEY,
    region: config.REGION,
});

const envioS3 = async(ruta, emplid, newname, ext, carrera, unidad_negocio, ciclo, apellido_alumno, nombre_alumno, descripcion_carrera) => {
    pool.query(`SELECT * FROM photo_students where emplid ='${emplid}'`, (error, results) => {
        if (error) {
            throw error
        }
        if (results.rows.length) {
            var s3 = new AWS.S3();
            s3.deleteObject({
                Bucket: 'bucket-vacunacion-miportal',
                Key: emplid + '/' + results.rows[0].nombre_file
            }, function(err, data) {})
        }
    })

    var filePath = ruta
    var s3 = new AWS.S3();
    //configuring parameters
    var params = {
        Bucket: 'bucket-vacunacion-miportal',
        Body: fs.createReadStream(filePath),
        Key: emplid + "/" + path.basename(filePath),
        ACL: 'public-read'
    };

    s3.upload(params, function(err, data) {
        //handle error
        if (err) {
            console.log("Error", err);
        }

        //success
        if (data) {
            registroDB(emplid, newname, `${emplid}.${ext}`, data.Location, 'A', 'profile', carrera, unidad_negocio, ciclo, apellido_alumno, nombre_alumno, descripcion_carrera)
            console.log("Uploaded in:", data.Location);
        }
        fs.unlinkSync(ruta);
        //rimraf.sync('./uploads/' + emplid);
    });
}

const { Pool } = require('pg');
const pool = new Pool({
    host: config.DB_HOST,
    user: config.DB_USER,
    database: config.DB_DATABASE,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
});

const registroDB = async(emplid, nombre_file, original_name, ruta_file, estado, tipo, carrera, unidad_negocio, ciclo, apellido_alumno, nombre_alumno, descripcion_carrera) => {
    pool.query(`SELECT * FROM photo_students where emplid ='${emplid}'`, (error, results) => {
        if (error) {
            throw error
        }
        if (!results.rows.length) {
            insertPhotoStudent(emplid, nombre_file, original_name, ruta_file, estado, tipo).then(result => {
                if (result) {
                    console.log('Photo inserted');
                    insertHistoricoPhotoStudent(emplid, apellido_alumno, nombre_alumno, original_name, ruta_file, carrera, descripcion_carrera, unidad_negocio, ciclo, '', 'SI').then(result => {
                        if (result)
                            console.log('Photo inserted Historico');
                    })
                }
            });
        } else {
            updatePhotoStudent(emplid, nombre_file, original_name, ruta_file, estado, tipo).then(result => {
                if (result) {
                    console.log('Photo updated');
                    insertHistoricoPhotoStudent(emplid, apellido_alumno, nombre_alumno, original_name, ruta_file, carrera, descripcion_carrera, unidad_negocio, ciclo, '', 'SI').then(result => {
                        if (result)
                            console.log('Photo inserted Historico');
                    })
                }
            });
        }
    })
};

const insertPhotoStudent = async(emplid, nombre_file, original_name, ruta_file, estado, tipo) => {
    try {
        const date = new Date().toISOString()
        await pool.query(`INSERT INTO "photo_students" ("emplid", "nombre_file", 
                "original_name", "ruta_file", "estado", "tipo", "created_at", "updated_at")  
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [emplid, nombre_file, original_name, ruta_file, estado, tipo, date, date])

        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const insertHistoricoPhotoStudent = async(emplid, apellido_alumno, nombre_alumno, original_name, ruta_file, carrera, descripcion_carrera, unidad_negocio, ciclo, tipo, foto) => {
    try {
        const date = new Date().toISOString()
        const res = await pool.query(`INSERT INTO "historico_photo_students" ("emplid", "apellido_alumno", "nombre_alumno", "original_nombre_file", "ruta_file", 
                        "carrera", "descripcion_carrera", "unidad_negocio", "ciclo", "tipo", "foto", "created_at", "updated_at")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [emplid, apellido_alumno, nombre_alumno, original_name, ruta_file, carrera, descripcion_carrera, unidad_negocio, ciclo, tipo, foto, date, date])

        console.log('Historico_0 =>', res.rowCount);

        if (res.rowCount == 1) {
            await pool.query(`update historico_photo_students set ruta_file=''
              where emplid='${emplid}' and id not in (select max(id) from historico_photo_students where emplid='${emplid}')`)
        }

        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

const updatePhotoStudent = async(emplid, nombre_file, original_name, ruta_file, estado, tipo) => {
    try {
        const date = new Date().toISOString()
        await pool.query(`update photo_students set emplid='${emplid}', nombre_file='${nombre_file}', 
        original_name='${original_name}', ruta_file='${ruta_file}', estado='${estado}', tipo='${tipo}', updated_at='${date}'
        where emplid='${emplid}'`)

        return true;
    } catch (error) {
        console.error(error.stack);
        return false;
    }
};

//Requerimos el paquete
var nodemailer = require('nodemailer');

//Creamos el objeto de transporte
var transporter = nodemailer.createTransport({

    "host": config.MAIL_HOST,
    "port": config.MAIL_PORT,
    "secure": config.MAIL_ENCRYPTION,
    "auth": {
        "type": "login",
        "user": config.MAIL_USER,
        "pass": config.MAIL_PASSWORD,
    }
});

const envioMail = async(alumno, email) => {
    var mailOptions = {
        from: config.MAIL_FROM,
        to: email,
        subject: 'Confirmación de Foto Alumno',
        html: `
                <!--[if !mso]> <!-->
                    <div style="background: #f8f8f8;                         
                                    display: flex;
                                    align-items: start;
                                    flex-direction: column;
                                    justify-content: space-evenly;
                                    align-items: center;">
                            <div>
                                <img src="https://docs.cientifica.edu.pe/ux/notify-header.jpg" alt="">
                            </div>
                            <div width="100%" style="padding: 0.2em; background: #ef7a26; font-size: 20px; color:white; font-weight:bold">
                                ${alumno}
                            </div>
                            <div>                    
                                <img src="https://docs.cientifica.edu.pe/ux/notify-footer.jpg" alt="">
                            </div>
                    </div>                
                <!-- <![endif]-->

                <!--[if mso]>
                    <table cellpadding="0" cellspacing="0" style="text-align: center">
                        <tr>
                            <td><img src="https://docs.cientifica.edu.pe/ux/notify-header.jpg" alt=""></td>
                        </tr>
                        <tr>
                            <td style="background: #ef7a26; font-size: 20px; color:white; font-weight:bold; text-align: center;">${alumno}</td>
                        </tr>
                        <tr>
                            <td> <img src="https://docs.cientifica.edu.pe/ux/notify-footer.jpg" alt=""></td>
                        </tr>
                    </table>
                <![endif]-->
            `
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email enviado: ' + info.response);
        }
    });
}

const storageStrategy = multer.memoryStorage()

const upload = multer({ storage: storageStrategy })

app.post('/api/v1/upload', upload.single('file'), async(req, res) => {
    console.log('file =>', req.file)
    emplid = req.body.emplid
    alumno = req.body.alumno
    carrera = req.body.carrera
    apellido_alumno = req.body.apellido_alumno
    nombre_alumno = req.body.nombre_alumno
    descripcion_carrera = req.body.descripcion_carrera
    unidad_negocio = req.body.unidad_negocio
    ciclo = req.body.ciclo
    email = req.body.email
    imagen = req.file

    const ext = imagen.originalname.split('.').pop()
    const resizeImage = sharp(imagen.buffer).resize(240, 288)
    const resizeImageBuffer = await resizeImage.toBuffer()
    const newname = `${emplid}_${Date.now()}_profile.${ext}`

    var dir = './uploads/' + emplid

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dir + '/' + newname, resizeImageBuffer)
    await envioS3(dir + '/' + newname, emplid, newname, ext, carrera, unidad_negocio, ciclo, apellido_alumno, nombre_alumno, descripcion_carrera)
    await envioMail(alumno, email)
    await res.send({ status: true, data: 'Imagen Cargada' })
})

app.get('/generateEncrypt/:text', async(req, res) => {
    const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
    let encryptedData = cipher.update(req.params.text, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    res.send(encryptedData);
});

app.get('/generateDencrypt/:text', async(req, res) => {
    const decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
    let decryptedData = decipher.update(req.params.text, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    res.send({data: decryptedData});
});

const api_photostudents = require('./app/routes/photostudents');

const api_route = "/api/v1";
app.use(api_route, api_photostudents);

server.listen(PORT, function() { console.log('API running on PORT ' + server.address().port); });

module.exports = app;