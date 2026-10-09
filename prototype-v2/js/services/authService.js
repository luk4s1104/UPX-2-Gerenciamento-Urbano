/**
 * AUTENTICAÇÃO (INTEGRADA AO FIREBASE)
 */
import { ler, salvar, gerarId, simularLatencia } from './storage.js';

import { auth, db } from "../config/firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
// 1. IMPORTANTE: Adicionamos a importação das funções do Firestore abaixo
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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
  try {
    // 1. Cria o usuário no Firebase Authentication
    const credencialUsuario = await createUserWithEmailAndPassword(auth, email, senha);
    const usuarioFirebase = credencialUsuario.user;

    // 2. Salva o nome real do usuário dentro do perfil do Firebase (displayName)
    await updateProfile(usuarioFirebase, {
      displayName: nome.trim()
    });

    // 3. NOVO: Salva os dados na coleção 'users' do Firestore usando o UID real dele
    await setDoc(doc(db, "users", usuarioFirebase.uid), {
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      password: senha // Salva a senha para manter compatibilidade com o documento Cleiton Jesus do print
    });

    // 4. Registra o espelho no armazenamento simulado local
    const usuarios = ler('usuarios', []);
    const novoUsuario = {
      id: usuarioFirebase.uid,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      perfil: email.includes('gestor') ? 'gestor' : 'cidadao',
      criadoEm: new Date().toISOString(),
    };
    
    usuarios.push(novoUsuario);
    salvar('usuarios', usuarios);

    // 5. Salva a sessão no navegador para mantê-lo logado após criar a conta
    salvarSessao(novoUsuario.id, true);
    return semSenha(novoUsuario);

  } catch (error) {
    console.error("Erro Firebase Cadastro:", error.code);
    if (error.code === "auth/email-already-in-use") {
      throw new Error('Este e-mail já está cadastrado.');
    } else if (error.code === "auth/invalid-email") {
      throw new Error('O formato do e-mail digitado é inválido.');
    } else if (error.code === "auth/weak-password") {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    } else {
      throw new Error('Não foi possível conectar ao servidor de cadastro.');
    }
  }
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
