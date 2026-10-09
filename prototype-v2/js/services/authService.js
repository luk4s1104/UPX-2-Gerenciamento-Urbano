/**
 * AUTENTICAÇÃO (INTEGRADA AO FIREBASE)
 */
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
import { db } from "../config/firebase.js"
import { auth } from "../config/firebase.js"
import { ler, salvar, gerarId, simularLatencia } from './storage.js';

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
  if (lembrar) localStorage.setItem(CHAVE_SESSAO, sessao);
  else sessionStorage.setItem(CHAVE_SESSAO, sessao);
}

/**
 * Usuário logado agora (ou null).
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
    const credencialUsuario = await signInWithEmailAndPassword(auth, email, senha);
    const usuarioFirebase = credencialUsuario.user;

    const usuarios = ler('usuarios', []);
    let usuarioLocal = usuarios.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());

    if (!usuarioLocal) {
      usuarioLocal = {
        id: usuarioFirebase.uid,
        nome: usuarioFirebase.displayName || email.split('@')[0],
        email: email.trim().toLowerCase(),
        perfil: email.includes('gestor') ? 'gestor' : 'cidadao',
        criadoEm: new Date().toISOString(),
      };
      usuarios.push(usuarioLocal);
      salvar('usuarios', usuarios);
    }

    salvarSessao(usuarioLocal.id, lembrar);
    return semSenha(usuarioLocal);

  } catch (error) {
    console.error("Erro Firebase Auth:", error.code);
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
  const credencialUsuario = await createUserWithEmailAndPassword(auth, email.trim(), senha)
  const usuarioFirebase = credencialUsuario.user
  await updateProfile(usuarioFirebase, { displayName: nome.trim() })
  const dadosUsuario = {
    id: usuarioFirebase.uid,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    perfil: 'cidadao',
    criadoEm: new Date().toISOString()
  }
  await setDoc(doc(db, 'users', usuarioFirebase.uid), dadosUsuario)
  return {
    id: dadosUsuario.id,
    nome: dadosUsuario.nome,
    email: dadosUsuario.email,
    perfil: dadosUsuario.perfil
  };
}

export function sair() {
  localStorage.removeItem(CHAVE_SESSAO);
  sessionStorage.removeItem(CHAVE_SESSAO);
}

export function nomeDoUsuario(usuarioId) {
  const usuario = ler('usuarios', []).find((item) => item.id === usuarioId);
  return usuario ? usuario.nome : 'Usuário removido';
}

export function perfilDoUsuario(usuarioId) {
  const usuario = ler('usuarios', []).find((item) => item.id === usuarioId);
  return usuario ? usuario.perfil : 'cidadao';
}
