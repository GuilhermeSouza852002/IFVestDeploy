const { Router } = require('express');
const { Usuario } = require('../models');

const roteador = Router()

//Cadastro rotas relacionadas ao cadastro de usuario

roteador.get('/home', (req, res) => {
    res.status(200).render('usuario/inicio');
});

roteador.get('/login', (req, res) => {
    let errorMessage = req.session.errorMessage;
    console.log(errorMessage);
    if(errorMessage === null){
        errorMessage = " ";
    }
    req.session.errorMessage = null; // Limpa a mensagem de erro após exibi-la
    res.status(200).render('usuario/login', { errorMessage });
});

roteador.get('/cadastro', (req, res) => {
    res.status(200).render('usuario/cadastro');
});

roteador.post('/logoff', (req, res) => {
    console.log("....deslogando")
    req.session.destroy();
    res.redirect('/usuario/login');
});

// ... outras rotas e código ...

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
            req.session.perfil = resposta.perfil;
            res.redirect('/usuario/inicioLogado');
        } else {
            req.session.errorMessage = "USUÁRIO OU SENHA INCORRETOS !!!!";
            res.redirect('/login');
        }
    } catch (err) {

        console.error(err)
        req.session.errorMessage = "Ocorreu um erro ao tentar fazer login.";
        res.redirect('/login');
    }
});

// ... outras rotas e código ...

roteador.post('/cadastro', async (req, res) => {
    const { nome, usuario, senha, email, email_secundario } = req.body;
    try{
        if( !nome || !usuario || !senha || !email){
            console.log(nome, usuario, senha, email)
            throw new Error("Dados Invalidos")
            
        }
        
        
        await Usuario.create({ nome, usuario, senha, email, email_secundario });

        res.status(201).redirect('/login');
    }catch(err){
        console.error(err)
        res.status(201).redirect('/cadastro');
    }

});

module.exports = roteador;

