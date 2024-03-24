const { Router } = require('express');
const { Usuario } = require('../models');
const { Favorito } = require('../models');
const { Topico } = require('../models');
const { Simulados } = require('../models');
const { Questões } = require('../models');
const { Area } = require('../models');
const { PerguntasProvas } = require('../models');
const { Resposta } = require('../models');
const roteador = Router()

//Rota da API chatgpt(Utilizar apenas quando necessario)
roteador.get('/openIA', async (req, res) => {
  try {
    // Gerar conclusão usando o OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "Explique como funciona a estrutura de um jogo feito em pygame" }],
      model: "gpt-3.5-turbo",
    });

    // Enviar resposta ao cliente
    res.json(completion.choices[0]);
  } catch (error) {
    // Lidar com erros
    console.error('Erro:', error);
    res.status(500).send('Erro ao processar a solicitação');
  }
});


// rota de perfil de usuario removi as outras paginas iguais e adicionei o tipo de perfil ao usuario
roteador.get('/perfil', async (req, res) => {
  const id = req.session.idUsuario;

  const usuario = await Usuario.findByPk(id);
  const favorito = await Favorito.findOne({
    where: { usuarioId: id },
    include: { model: Topico, as: 'Topico' }
  });
  console.log(usuario.perfil);
  if (usuario == null) {
    res.status(200).redirect('/usuario/login');
  } else {
    res.status(200).render('usuario/perfil', { usuario, id, favorito });
  }
});


roteador.get('/inicioLogado', async (req, res) => {
  const id = req.session.idUsuario;

  const usuario = await Usuario.findByPk(id);
  if (usuario == null) {
    res.status(200).redirect('/usuario/login');
  } else {

    res.status(200).render('usuario/inicioLogado');
  }

});


//rota /perfil/MudarSenha nao existe o arquivo editSenha deve ser criado
// roteador.get('/perfil/MudarSenha', async (req, res) => {
//   const id2 = req.session.idUsuario;

//   let senha = await Usuario.findByPk(id2);
//   res.status(200).render('editSenha', { senha, id2,  });
// });



//rota de alterar senha do usuario funciona
roteador.patch('/:id', async (req, res) => {
  let { senha } = req.body;
  try {
    console.log(senha)
    const id = req.session.idUsuario;
    console.log(id)

    if (id != req.params.id) {
      throw new Error("Erro ao atualizar usuario")
    }

    const usuario = await Usuario.findOne({
      where: {
        id: req.params.id
      }
    })
    console.log(usuario)

    if (!usuario) {
      throw new Error("Usuario não existe")
    }

    await Usuario.update({ senha: senha },
      {
        where: { id: usuario.id }
      }
    );
    req.session.destroy();
    res.status(200).redirect("/login");
  } catch (err) {
    req.session.destroy();
    res.status(500).redirect('/inicio');
  }


});


//rota de deletar usuario funciona
roteador.delete('/:id', async (req, res) => {

  const id = req.session.idUsuario;

  try {

    if (id != req.params.id) {
      throw new Error("Erro ao excluir usuario")
    }

    await Usuario.destroy(
      {
        where:
        {
          id: req.params.id
        }
      }
    );
    req.session.destroy();
    res.status(200).redirect('/usuario/login');
  } catch (err) {
    req.session.destroy();
    res.status(500).redirect('/inicio');
  }
});

roteador.get('/registrar-questao/:tipo', async (req, res) => {
  if (!req.session.login) {
    return res.status(401).redirect('/usuario/login');
  }
  const Topicos = await Topico.findAll();
  const tipo = req.params.tipo.toLowerCase();
  res.status(200).render('usuario/registroPergunta', { Topicos, tipo });
});

// roteador.get('/registrar-questaoX', async (req, res) => {
//   if (!req.session.login) {
//     return res.status(401).redirect('/usuario/login');
//   }
//   const Topicos = await Topico.findAll();
//   res.status(200).render('usuario/registroPerguntaX', { Topicos, });
// });
//

roteador.post('/registrar-questao/:tipo', async (req, res) => {
  try {
    const { pergunta, topicoId, titulo, respostas } = req.body;
    const tipo = req.params.tipo;
    const usuarioId = req.session.idUsuario;

    if (tipo === "objetiva") {
      const respostaConcatenada = respostas.join('_');
      await Questões.create({
        pergunta,
        titulo,
        topicoId,
        usuarioId,
        resposta: respostaConcatenada
      });
    } else if (tipo === "dissertativa") {

      var resposta = " "

      await Questões.create({
        pergunta,
        titulo,
        topicoId,
        usuarioId,
        resposta: resposta
      });
    } else {
      throw new Error(" Tipo de questao invalido")
    }


    res.status(201).redirect('/usuario/inicioLogado');
  } catch (error) {
    console.error(error);
    res.status(500).redirect('/usuario/inicioLogado');
  }
});

// roteador.post('/registrar-questaoX', async (req, res) => {
//   try {
//     const { pergunta, topicoId, titulo } = req.body;
//     const { respostas } = req.body;
//     const respostaConcatenada = respostas.join('_');

//     // Use o modelo Pergunta para criar a pergunta no banco de dado

//     await Questões.create({
//       pergunta,
//       titulo,
//       topicoId,
//       usuarioId,
//       resposta: respostaConcatenada

//     });

//     res.status(201).redirect('/usuario/inicioLogado');
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ mensagem: 'Ocorreu um erro ao registrar a pergunta.' });
//   }
// });

roteador.get('/criar-questionario', async (req, res) => {
  const areas = await Area.findAll();
  res.render('prova/criar-prova', { areas, });
});

// Rota para lidar com o envio do formulário
roteador.post('/criar-prova', async (req, res) => {
  const { titulo, descricao, areaId, tipo } = req.body;
  const usuarioId1 = req.session.idUsuario;

  try {
    // Crie um novo questionário no banco de dados usando Sequelize
    const novoProva = await Simulados.create({
      titulo,
      descricao,
      areaId,
      usuarioId: usuarioId1,
      tipo: tipo
    });

    res.redirect(`/usuario/Simulados/${novoProva.id}/adicionar-questoes`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Ocorreu um erro ao criar o questionário.');
  }
});

// Rota para visualizar questionários
roteador.get('/Simulados', async (req, res) => {
  try {
    const provas = await Simulados.findAll(); // Supondo que você tenha um modelo "Provas"

    res.render('prova/lista-provas', { provas, });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ocorreu um erro ao recuperar os questionários.');
  }
});

// Rota para associar uma pergunta a um questionário (formulário)
roteador.get('/Simulados/:provaId/adicionar-questoes', async (req, res) => {
  try {
    const provaId = req.params.provaId;
    const prova = await Simulados.findByPk(provaId);
    const perguntas = await Questões.findAll();
    const topicos = await Topico.findAll();
    const areas = await Area.findAll();


    res.render('prova/formularioAssociarPergunta', { prova, perguntas, topicos, areas, prova, });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar formulário de associação de pergunta');
  }
});

// Importe os modelos necessários e quaisquer outras dependências que você precise

// Rota para processar o formulário de associação de pergunta a questionário
roteador.post('/Simulados/:provaId/adicionar-questao', async (req, res) => {
  try {
    const { provaId } = req.params;
    const { perguntaId } = req.body;

    // Primeiro, verifique se o questionário e a pergunta existem
    const prova = await Simulados.findByPk(provaId);
    const pergunta = await Questões.findByPk(perguntaId);

    if (!prova || !pergunta) {
      return res.status(404).send('Questionário ou pergunta não encontrados.');
    }

    // Agora, associe a pergunta ao questionário usando o método addPerguntas
    await prova.addQuestões(pergunta);

    res.redirect(`/usuario/Simulados/${provaId}/adicionar-questoes`);
  } catch (error) {
    console.error('Erro ao associar Questões a questionário:', error);
    res.status(500).send('Erro ao associar Questões a questionário.');
  }
});


// Rota para processar as respostas do questionário
// Rota para uma prova com alternativas
roteador.get('/FazerProva/:provaId', async (req, res) => {
  try {
    const provaId = req.params.provaId;

    // Busque as perguntas da prova específica usando o modelo PerguntasProvas
    const perguntasProvas = await PerguntasProvas.findAll({
      where: { provaId },
    });

    // Crie um array para armazenar os detalhes das perguntas
    const perguntas = [];

    // Para cada entrada em perguntasProvas, busque os detalhes da pergunta usando o modelo Questões
    for (const perguntaProva of perguntasProvas) {
      const perguntaDetalhe = await Questões.findByPk(perguntaProva.QuestõesId);
      perguntas.push(perguntaDetalhe);
    }

    const prova = await Simulados.findByPk(provaId);

    res.render('prova/prova', { perguntas, prova, });
  } catch (error) {
    console.error('Erro ao buscar perguntas da prova:', error);
    res.status(500).send('Erro ao buscar perguntas da prova.');
  }
});
roteador.get('/FazerProvatempo/:provaId', async (req, res) => {
  try {
    const provaId = req.params.provaId;

    // Busque as perguntas da prova específica usando o modelo PerguntasProvas
    const perguntasProvas = await PerguntasProvas.findAll({
      where: { provaId },
    });

    // Crie um array para armazenar os detalhes das perguntas
    const perguntas = [];

    // Para cada entrada em perguntasProvas, busque os detalhes da pergunta usando o modelo Questões
    for (const perguntaProva of perguntasProvas) {
      const perguntaDetalhe = await Questões.findByPk(perguntaProva.QuestõesId);
      perguntas.push(perguntaDetalhe);
    }

    const prova = await Simulados.findByPk(provaId);

    res.render('prova/provaTempo', { perguntas, prova, });
  } catch (error) {
    console.error('Erro ao buscar perguntas da prova:', error);
    res.status(500).send('Erro ao buscar perguntas da prova.');
  }
});

// Rota para uma prova com alternativas
roteador.get('/FazerProvaX/:provaId', async (req, res) => {
  try {
    const provaId = req.params.provaId;

    // Busque as perguntas da prova específica usando o modelo PerguntasProvas
    const perguntasProvas = await PerguntasProvas.findAll({
      where: { provaId },
    });

    // Crie um array para armazenar os detalhes das perguntas
    const perguntas = [];

    // Para cada entrada em perguntasProvas, busque os detalhes da pergunta usando o modelo Perguntas
    for (const perguntaProva of perguntasProvas) {
      const perguntaDetalhe = await Questões.findByPk(perguntaProva.QuestõesId);
      perguntas.push(perguntaDetalhe);
    }

    const prova = await Simulados.findByPk(provaId);

    res.render('prova/provaX', { perguntas, prova, });
  } catch (error) {
    console.error('Erro ao buscar perguntas da prova:', error);
    res.status(500).send('Erro ao buscar perguntas da prova.');
  }
});

roteador.get('/FazerProvaXtempo/:provaId', async (req, res) => {
  try {
    const provaId = req.params.provaId;

    // Busque as perguntas da prova específica usando o modelo PerguntasProvas
    const perguntasProvas = await PerguntasProvas.findAll({
      where: { provaId },
    });

    // Crie um array para armazenar os detalhes das perguntas
    const perguntas = [];

    // Para cada entrada em perguntasProvas, busque os detalhes da pergunta usando o modelo Perguntas
    for (const perguntaProva of perguntasProvas) {
      const perguntaDetalhe = await Questões.findByPk(perguntaProva.QuestõesId);
      perguntas.push(perguntaDetalhe);
    }

    const prova = await Simulados.findByPk(provaId);

    res.render('prova/provaXtempo', { perguntas, prova, });
  } catch (error) {
    console.error('Erro ao buscar perguntas da prova:', error);
    res.status(500).send('Erro ao buscar perguntas da prova.');
  }
});

roteador.post('/responder-prova/:provaId', async (req, res) => {
  const { respostas } = req.body;
  const { idUsuario } = req.session;
  const { provaId } = req.params;
  const respostaConcatenada = respostas.join(',');

  try {
    await Resposta.create({
      resposta: respostaConcatenada,
      usuarioId: idUsuario,
      provaId,
    });

    return res.redirect('/usuario/inicioLogado');
  } catch (error) {
    console.error('Erro ao salvar respostas associadas:', error);
    return res.status(500).send('Erro ao salvar respostas associadas.');
  }
});

roteador.post('/responder-provaX/:provaId', async (req, res) => {
  const { resposta } = req.body;
  const { idUsuario } = req.session;
  const { provaId } = req.params;
  const respostaConcatenada = resposta.join(',');
  try {
    await Resposta.create({
      resposta: respostaConcatenada,
      usuarioId: idUsuario,
      provaId,
    });

    return res.redirect('/usuario/inicioLogado');
  } catch (error) {
    console.error('Erro ao salvar respostas associadas:', error);
    return res.status(500).send('Erro ao salvar respostas associadas.');
  }
});

roteador.get('/video', (req, res) => {
  res.status(200).render('conteudo/video', {});
});

roteador.get('/seleciona-simulado', async (req, res) => {
  const prova = await Simulados.findAll();
  const topicos = await Topico.findAll();
  const areas = await Area.findAll();

  res.render('simulado/seleciona-simulado', { topicos, prova, areas, });
}
);

roteador.get('/seleciona-simulado-objetiva', async (req, res) => {
  const prova = await Simulados.findAll();
  const topicos = await Topico.findAll();
  const areas = await Area.findAll();

  res.render('simulado/seleciona-simulado2', { topicos, prova, areas, });
}
);

roteador.post('/search', async (req, res) => {
  const searchTerm = req.body.searchTerm.toLowerCase();

  try {
    // Busque todos os simulados usando o modelo Simulados
    const simulados = await Simulados.findAll();

    // Filtrando os resultados pelo nome ou data
    const results = simulados.filter(simulado => {
      const formattedDate = formatBrazilianDate(simulado.createdAt);
      return simulado.titulo.toLowerCase().includes(searchTerm) || formattedDate.includes(searchTerm);
    });

    res.render('simulado/pesquisa', { simulados: results, searchTerm, });
  } catch (error) {
    console.error('Erro ao buscar simulados:', error);
    res.status(500).send('Erro ao buscar simulados.');
  }
  //topico e area
});

// Função para formatar a data no formato brasileiro (dd/mm/yyyy) e substituir "/" por "-"
function formatBrazilianDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

roteador.get('/seleciona-topico-aleatorio', async (req, res) => {
  const topicos = await Topico.findAll();
  const areas = await Area.findAll();

  res.render('simulado/seleciona-topico-aleatorio', { topicos, areas, });
}
);

roteador.post('/aleatorio/:topicoId/:numeroDeQuestoes', async (req, res) => {
  const { topicoId, numeroDeQuestoes } = req.params;
  const questao = await Questões.findAll();
  const usuarioId1 = req.session.idUsuario;

  try {
    const simulado = await Simulados.create({
      titulo: 'Simulado Aleatório',
      descricao: 'Simulado gerado automaticamente',
      usuarioId: usuarioId1,
      areaId: 1,
      tipo: 3, // Defina o tipo de simulado conforme necessário
    });
    console.log(simulado.id)

    const questoesDoTopico = await Questões.findAll({
      where: { topicoId },
    });

    // Embaralhe as questões para obter uma ordem aleatória
    const questoesEmbaralhadas = questoesDoTopico.sort(() => 0.5 - Math.random());

    // Selecione as primeiras "numeroDeQuestoes" questões
    const questoesSelecionadas = questoesEmbaralhadas.slice(0, numeroDeQuestoes);

    for (const questao of questoesSelecionadas) {
      await PerguntasProvas.create({
        QuestõesId: questao.id,
        provaId: simulado.id,
      });
    }
    var provaId = simulado.id;

    return res.redirect(`/usuario/responder-prova-aleatoria/${provaId}`);
  } catch (error) {
    console.error('Erro ao criar simulado aleatório:', error);
    res.status(500).json({ error: 'Erro ao criar simulado aleatório' });
  }
});

roteador.get('/responder-prova-aleatoria/:provaId', async (req, res) => {
  try {
    const provaId = req.params.provaId;

    // Busque as perguntas da prova específica usando o modelo PerguntasProvas
    const perguntasProvas = await PerguntasProvas.findAll({
      where: { provaId },
    });

    // Crie um array para armazenar os detalhes das perguntas
    const perguntas = [];

    // Para cada entrada em perguntasProvas, busque os detalhes da pergunta usando o modelo Perguntas
    for (const perguntaProva of perguntasProvas) {
      const perguntaDetalhe = await Questões.findByPk(perguntaProva.QuestõesId);
      perguntas.push(perguntaDetalhe);
    }

    const prova = await Simulados.findByPk(provaId);

    res.render('prova/questionarioAleatorio', { perguntas, prova, });
  } catch (error) {
    console.error('Erro ao buscar perguntas da prova:', error);
    res.status(500).send('Erro ao buscar perguntas da prova.');
  }
});

roteador.post('/responder-prova-aleatoria/:provaId', async (req, res) => {
  const { resposta } = req.body;
  const { idUsuario } = req.session;
  const { provaId } = req.params;
  const respostaConcatenada = resposta.join(',');
  try {
    await Resposta.create({
      resposta: respostaConcatenada,
      usuarioId: idUsuario,
      provaId,
    });

    return res.redirect('/usuario/inicioLogado');
  } catch (error) {
    console.error('Erro ao salvar respostas associadas:', error);
    return res.status(500).send('Erro ao salvar respostas associadas.');
  }
});

// roteador.use(async (req, res, next) => {
//     if (req.session.idUsuario) {
//         const usuario = await Usuario.findByPk(req.session.idUsuario);
//         if (usuario) {
//             // Armazena o nome do usuário em uma variável global
//             res.locals.perfilUsuario = usuario.perfil;
//         }
//     }
//     next();
// });


module.exports = roteador;

