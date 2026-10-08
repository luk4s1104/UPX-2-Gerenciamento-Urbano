/**
 * AUTENTICAÇÃO (SIMULADA)
 * ⚠️ Protótipo: não existe segurança real aqui, porque tudo fica no navegador.
 * Numa versão com backend, o servidor é quem confere a senha e devolve um token.
 *
 * Mesmo assim, não guardamos a senha em texto puro: guardamos o HASH SHA-256.
 * Hash é uma "impressão digital" da senha: dá para comparar, mas não dá para
 * descobrir a senha original a partir dele.
 */
import { ler, salvar, gerarId, simularLatencia } from './storage.js';

import { auth } from "../config/firebase.js";
import { signInWithEmailAndPassword } from "https://gstatic.com";

const CHAVE_SESSAO = 'cidadeMelhor:sessao';

/** Calcula o hash SHA-256 de um texto usando a API de criptografia do navegador. */
export async function gerarHash(texto) {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Remove o hash antes de devolver o usuário para as páginas. */
function semSenha(usuario) {
  if (!usuario) return null;
  const { senhaHash, ...dadosPublicos } = usuario;
  return dadosPublicos;
}

/* ---------- Sessão ---------- */

function lerSessao() {
  try {
    const texto = localStorage.getItem(CHAVE_SESSAO) || sessionStorage.getItem(CHAVE_SESSAO);
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

function salvarSessao(usuarioId, lembrar) {
  const sessao = JSON.stringify({ usuarioId, iniciadaEm: new Date().toISOString() });
  // "Lembrar de mim": localStorage continua depois de fechar o navegador; sessionStorage não.
  if (lembrar) localStorage.setItem(CHAVE_SESSAO, sessao);
  else sessionStorage.setItem(CHAVE_SESSAO, sessao);
}

/**
 * Usuário logado agora (ou null).
 * É síncrona de propósito: o header precisa dessa informação imediatamente.
 */
export function usuarioAtual() {
  const sessao = lerSessao();
  if (!sessao) return null;
  const usuario = ler('usuarios', []).find((item) => item.id === sessao.usuarioId);
  return semSenha(usuario);
}

export function ehGestor(usuario = usuarioAtual()) {
  return Boolean(usuario && usuario.perfil === 'gestor');
}

/* ---------- Ações ---------- */

export async function entrar(email, senha, lembrar = false) {
  try {
    // 1. Faz o login no Firebase com e-mail e senha
    const credencialUsuario = await signInWithEmailAndPassword(auth, email, senha);
    const usuarioFirebase = credencialUsuario.user;

    // 2. Procura se esse usuário já existe no armazenamento simulado do site
    const usuarios = ler('usuarios', []);
    let usuarioLocal = usuarios.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());

    // Se o usuário não existir localmente no navegador (ex: foi criado direto no console do Firebase), cria o registro dele
    if (!usuarioLocal) {
      usuarioLocal = {
        id: usuarioFirebase.uid, // Usa o ID real gerado pelo Firebase
        nome: usuarioFirebase.displayName || email.split('@')[0],
        email: email.trim().toLowerCase(),
        perfil: email.includes('gestor') ? 'gestor' : 'cidadao',
        criadoEm: new Date().toISOString(),
      };
      usuarios.push(usuarioLocal);
      salvar('usuarios', usuarios);
    }

    // 3. Salva a sessão para o resto do site saber que ele está logado
    salvarSessao(usuarioLocal.id, lembrar);
    
    return semSenha(usuarioLocal);

  } catch (error) {
    console.error("Erro Firebase Auth:", error.code);
    
    // 4. Converte os erros do Firebase para as mensagens de erro que seu formulário HTML já exibe
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      throw new Error('E-mail ou senha incorretos.');
    } else if (error.code === "auth/invalid-email") {
      throw new Error('O formato do e-mail digitado é inválido.');
    } else if (error.code === "auth/too-many-requests") {
      throw new Error('Muitas tentativas bloqueadas. Tente novamente mais tarde.');
    } else {
      throw new Error('Não foi possível conectar ao servidor de autenticação.');
    }
  }
}


export async function emailJaCadastrado(email) {
  const usuarios = ler('usuarios', []);
  return usuarios.some((item) => item.email.toLowerCase() === email.trim().toLowerCase());
}

export async function cadastrar({ nome, email, senha }) {
  await simularLatencia(500);
  if (await emailJaCadastrado(email)) {
    throw new Error('Este e-mail já está cadastrado.');
  }
  const usuarios = ler('usuarios', []);
  const novoUsuario = {
    id: gerarId('u'),
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    perfil: 'cidadao',
    senhaHash: await gerarHash(senha),
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(novoUsuario);
  salvar('usuarios', usuarios);
  salvarSessao(novoUsuario.id, true);
  return semSenha(novoUsuario);
}

export function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
  sessionStorage.removeItem(CHAVE_SESSAO);
}

/** Nome de um usuário pelo id (usado para mostrar o autor de pins e comentários). */
export function nomeDoUsuario(usuarioId) {
  const usuario = ler('usuarios', []).find((item) => item.id === usuarioId);
  return usuario ? usuario.nome : 'Usuário removido';
}

export function perfilDoUsuario(usuarioId) {
  const usuario = ler('usuarios', []).find((item) => item.id === usuarioId);
  return usuario ? usuario.perfil : 'cidadao';
}
