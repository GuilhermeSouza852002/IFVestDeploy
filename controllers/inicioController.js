const { Router } = require('express');
const { Usuario } = require('../models');

const roteador = Router()

//Cadastro rotas relacionadas ao cadastro de usuario

roteador.get('/inicio', (req, res) => {
    res.status(200).render('usuario/inicio');
});

roteador.get('/login', (req, res) => {
    res.status(200).render('usuario/login');
});

roteador.get('/cadastro', (req, res) => {
    res.status(200).render('usuario/cadastro');
});

roteador.get('/logoff', (req, res) => {
    req.session.destroy();
    res.redirect('/usuario/login');
});

roteador.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;
    try {
        if (!usuario || !senha) {
            throw new Error("Usuario ou Senha invalidos")
        }
        const resposta = await Usuario.findOne({
            where: {
                usuario: usuario,
                senha: senha
            }
        });
        console.log(resposta)

        req.session.login = false;

        if (resposta) {
            req.session.login = true;
            req.session.idUsuario = resposta.id;
            res.redirect('/usuario/inicioLogado');
        }
    } catch (err) {
        console.error(err)
        res.redirect('/usuario/login');
    }
});

roteador.post('/', async (req, res) => {
    const { nome, usuario, senha, email, email_secundario } = req.body;
    try{
        if( !nome || !usuario || !senha || !email){
            console.log(nome, usuario, senha, email)
            throw new Error("Dados Invalidos")
            
        }
        
        
        await Usuario.create({ nome, usuario, senha, email, email_secundario });

        res.status(201).redirect('/inicio/login');
    }catch(err){
        console.error(err)
        res.status(201).redirect('/inicio/cadastro');
    }

});

module.exports = roteador;

