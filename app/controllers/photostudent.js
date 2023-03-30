const config = require('../../config/config');
const https = require('https');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Pool } = require('pg');
const pool = new Pool({
    host: config.DB_HOST,
    user: config.DB_USER,
    database: config.DB_DATABASE,
    password: config.DB_PASSWORD,
    port: config.DB_PORT,
});


const getAllInstitucion = async(req, res) => {

    pool.query(`SELECT distinct unidad_negocio FROM historico_photo_students order by unidad_negocio`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const getAllPhotoStudents = async(req, res) => {

    pool.query(`SELECT id, emplid, apellido_alumno, nombre_alumno, original_nombre_file, ruta_file, carrera, descripcion_carrera, 
                       unidad_negocio, ciclo, foto, to_char(created_at + '-5 hours','YYYY-MM-DD HH24:MI:SS') created_at,
                       to_char(updated_at + '-5 hours','YYYY-MM-DD HH24:MI:SS') updated_at
                FROM historico_photo_students`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const getAllPhotoStudents_ = async(req, res) => {
    const id = req.params.id;

    pool.query(`SELECT id, emplid, apellido_alumno, nombre_alumno, original_nombre_file, ruta_file, carrera, descripcion_carrera, 
                        unidad_negocio, ciclo, foto, to_char(created_at + '-5 hours','YYYY-MM-DD HH24:MI:SS') created_at,
                        to_char(updated_at + '-5 hours','YYYY-MM-DD HH24:MI:SS') updated_at 
                FROM historico_photo_students where unidad_negocio='${id}'`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const getPhotoStudentbyEmplid = async(req, res) => {
    const id = req.params.id;

    pool.query(`SELECT * FROM photo_students where emplid ='${id}'`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const getVisiblePhotoStudent = async(req, res) => {
    const data = req.query;
    pool.query(`SELECT * FROM parametria_photo_student where tipo_llave='visible_photo_student' 
                and institucion='${data.institucion}' and ciclo='${data.ciclo}' 
                and TO_DATE(to_char(now() + '-5 hours','YYYY-MM-DD'),'YYYY-MM-DD') between fecha_inicio and fecha_fin`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const getAllVisiblePhotoStudent = async(req, res) => {
    pool.query(`SELECT id, institucion, ciclo, 
                to_char(fecha_inicio,'YYYY-MM-DD') as fecha_inicio, 
                to_char(fecha_fin,'YYYY-MM-DD') as fecha_fin
                FROM parametria_photo_student where tipo_llave='visible_photo_student'
                order by institucion, ciclo`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: results.rows, mensaje: 'correcto' })
    })
}

const addVisiblePhotoStudent = async(req, res) => {
    const req_ = req.body.data;
    const tipo_llave = 'visible_photo_student'
    const date = new Date().toISOString()

    pool.query(`SELECT * FROM "parametria_photo_student" where institucion ='${req_.institucion}' and ciclo ='${req_.ciclo}'`, (error, results) => {
        if (error) {
            throw error
        }
        if (!results.rows.length) {
            pool.query(`INSERT INTO "parametria_photo_student" ("tipo_llave", "institucion", 
            "ciclo", "fecha_inicio", "fecha_fin", "created_at", "updated_at")  
            VALUES ($1, $2, $3, $4, $5, $6, $7)`, [tipo_llave, req_.institucion, req_.ciclo, req_.fecha_inicio, req_.fecha_fin, date, date], (error, results) => {
                if (error) {
                    throw error
                }
                return res.send({ data: true, mensaje: 'correcto' })
            })
        } else {
            return res.send({ data: false, mensaje: 'El registro ya existe' })
        }
    })
}

const updVisiblePhotoStudent = async(req, res) => {
    const req_ = req.body.data;
    const date = new Date().toISOString()
    await pool.query(`UPDATE "parametria_photo_student" SET institucion='${req_.institucion}', ciclo='${req_.ciclo}', updated_at='${date}',
                        fecha_inicio='${req_.fecha_inicio}', fecha_fin='${req_.fecha_fin}' where id=${req_.id}`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: true, mensaje: 'correcto' })
    })
}

const deleteVisiblePhotoStudent = async(req, res) => {
    const id = req.params.id;
    pool.query(`DELETE FROM "parametria_photo_student" where id='${id}'`, (error, results) => {
        if (error) {
            throw error
        }
        return res.send({ data: true, mensaje: 'correcto' })
    })
}

const exportDataStudentPhoto = async(req, res) => {
    let dateNow = Date.now();
    let nameDir = `${path.join(__dirname, '../..')}/public/export${dateNow}`;
    fs.mkdirSync(nameDir);
    var output = fs.createWriteStream(`${nameDir}/target.zip`);
    var archive = archiver('zip');
    archive.pipe(output);
    for (let i = 0; i < req.body.length; i++) {
        new Promise((resolve,reject) => {
            https.get(req.body[i]['ruta_file'],(res) => {
                const path = `${nameDir}/${req.body[i]['original_nombre_file']}`; 
                const filePath = fs.createWriteStream(path);
                res.pipe(filePath);
                filePath.on('finish',() => {
                    filePath.close();
                    resolve('Done');
                })
            });
        }).then((e) => {
            if(req.body.length == i +1){
                archive.directory(nameDir, false);
                archive.finalize();
                return res.send({data: req.body, ruta:`public/export${dateNow}/target.zip`})
            }
        });
    }
}

module.exports = {
    getAllInstitucion,
    getAllPhotoStudents,
    getAllPhotoStudents_,
    getPhotoStudentbyEmplid,
    getVisiblePhotoStudent,
    getAllVisiblePhotoStudent,
    addVisiblePhotoStudent,
    updVisiblePhotoStudent,
    deleteVisiblePhotoStudent,
    exportDataStudentPhoto
}