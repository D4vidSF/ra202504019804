'use strict';
const view = document.querySelector('#view');
const message = document.querySelector('#message');
const labels = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída', active: 'Ativo', archived: 'Arquivado', low: 'Baixa', medium: 'Média', high: 'Alta' };
let renderVersion = 0;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const badge = value => `<span class="badge ${escapeHtml(value)}">${escapeHtml(labels[value] || value)}</span>`;
const options = (values, selected) => values.map(value => `<option value="${value}" ${value === selected ? 'selected' : ''}>${labels[value]}</option>`).join('');
const isTask = type => type === 'tasks';

async function api(path, init = {}) {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
  return data;
}

function notify(text, error = false) {
  message.textContent = text;
  message.className = error ? 'error' : '';
  message.hidden = !text;
}

function heading(title, subtitle, action = '') {
  return `<div class="heading"><div><span class="eyebrow">ORGANIZE O QUE IMPORTA</span><h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
}

function listView(type, records, projects, filter) {
  const task = isTask(type);
  const done = records.filter(record => record.status === (task ? 'completed' : 'archived')).length;
  const projectNames = new Map(projects.map(project => [project._id, project.name]));
  const selected = filter ? records.filter(record => record.project === filter) : records;
  const selector = task ? `<div class="field"><label for="project-filter">Projeto</label><select id="project-filter"><option value="">Todos os projetos</option>${projects.map(project => `<option value="${project._id}" ${project._id === filter ? 'selected' : ''}>${escapeHtml(project.name)}</option>`).join('')}</select></div>` : '';
  const rows = selected.map(record => `<tr><td><a class="record-name" href="#${type}/${record._id}">${escapeHtml(record.name)}</a><span class="record-description">${escapeHtml(record.description)}</span></td><td>${escapeHtml(task ? projectNames.get(record.project) || 'Projeto indisponível' : record.owner)}</td><td>${badge(record.status)}</td>${task ? `<td>${badge(record.priority)}</td>` : ''}<td><a href="#${type}/${record._id}" aria-label="Ver ${escapeHtml(record.name)}">Ver →</a></td></tr>`).join('');
  return heading(task ? 'Suas tarefas, em foco.' : 'Espaço para cada projeto.', task ? 'Transforme planos em pequenas conquistas diárias.' : 'Reúna suas tarefas e acompanhe o que está em andamento.', `<a class="button primary" href="#${type}/new">＋ ${task ? 'Nova tarefa' : 'Novo projeto'}</a>`) +
    `<div class="stats"><div class="stat"><span>${task ? 'Total de tarefas' : 'Total de projetos'}</span><strong>${records.length}</strong></div><div class="stat"><span>${task ? 'A concluir' : 'Ativos'}</span><strong>${records.length - done}</strong></div><div class="stat"><span>${task ? 'Concluídas' : 'Arquivados'}</span><strong>${done}</strong></div></div>` +
    `<section class="panel"><div class="panel-bar"><h2>${task ? 'Todas as tarefas' : 'Todos os projetos'} <span class="muted">(${selected.length})</span></h2>${selector}</div>${rows ? `<div class="table-wrap"><table><thead><tr><th>NOME</th><th>${task ? 'PROJETO' : 'RESPONSÁVEL'}</th><th>STATUS</th>${task ? '<th>PRIORIDADE</th>' : ''}<th>DETALHE</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="empty"><h2>${filter ? 'Nenhuma tarefa neste projeto' : 'Tudo começa com um primeiro passo'}</h2><p>${task ? 'Crie um projeto e adicione sua primeira tarefa.' : 'Crie um projeto para dar um lugar às suas ideias.'}</p><a class="button" href="#${task && !projects.length ? 'projects' : type}/new">${task && !projects.length ? 'Criar projeto' : 'Adicionar registro'} →</a></div>`}</section>`;
}

function formView(type, record = {}, projects = []) {
  const task = isTask(type);
  if (task && !projects.some(project => project.status === 'active')) {
    return heading('Primeiro, um projeto ativo.', 'Crie ou reative um projeto para organizar esta tarefa.') + '<a class="button primary" href="#projects">Ver projetos →</a>';
  }
  const projectSelect = `<div class="field full"><label for="project">Projeto</label><select id="project" name="project" required>${projects.filter(project => project.status === 'active').map(project => `<option value="${project._id}" ${project._id === record.project ? 'selected' : ''}>${escapeHtml(project.name)}</option>`).join('')}</select></div>`;
  return `<a class="back" href="#${type}">← Voltar à lista</a>` + heading(`${record._id ? 'Editar' : task ? 'Nova' : 'Novo'} ${task ? 'tarefa' : 'projeto'}`, 'Preencha os campos abaixo. Todos são obrigatórios.') +
    `<form class="panel form-panel" id="record-form">
      <div class="form-grid">
        <div class="field full"><label for="name">Nome</label><input id="name" name="name" required maxlength="100" value="${escapeHtml(record.name)}" autofocus></div>
        <div class="field full"><label for="description">Descrição</label><textarea id="description" name="description" required maxlength="2000">${escapeHtml(record.description)}</textarea></div>
        ${task ? projectSelect : `<div class="field full"><label for="owner">Responsável</label><input id="owner" name="owner" required maxlength="100" value="${escapeHtml(record.owner)}"></div>`}
        <div class="field"><label for="status">Status</label><select id="status" name="status">${options(task ? ['pending', 'in_progress', 'completed'] : ['active', 'archived'], record.status || (task ? 'pending' : 'active'))}</select></div>
        ${task ? `<div class="field"><label for="priority">Prioridade</label><select id="priority" name="priority">${options(['low', 'medium', 'high'], record.priority || 'medium')}</select></div>` : ''}
      </div>
      <div class="actions"><button type="submit" class="primary">Salvar ${task ? 'tarefa' : 'projeto'}</button><a class="button" href="#${type}">Cancelar</a></div>
    </form>`;
}

function detailView(type, record, projects) {
  const task = isTask(type);
  const project = projects.find(item => item._id === record.project);
  return `<a class="back" href="#${type}">← Voltar à lista</a>` + heading(record.name, task ? 'Cada detalhe ajuda você a avançar.' : 'Uma visão do seu projeto.') +
    `<article class="panel detail"><dl><dt>Descrição</dt><dd>${escapeHtml(record.description)}</dd><dt>Status</dt><dd>${badge(record.status)}</dd>${task ? `<dt>Prioridade</dt><dd>${badge(record.priority)}</dd><dt>Projeto</dt><dd><a href="#projects/${record.project}">${escapeHtml(project?.name || 'Ver projeto')}</a></dd>` : `<dt>Responsável</dt><dd>${escapeHtml(record.owner)}</dd>`}<dt>Criado em</dt><dd>${new Date(record.createdAt).toLocaleString('pt-BR')}</dd><dt>Atualizado em</dt><dd>${new Date(record.updatedAt).toLocaleString('pt-BR')}</dd></dl><div class="actions"><a class="button primary" href="#${type}/${record._id}/edit">Editar</a>${!task ? `<a class="button" href="#tasks?project=${record._id}">Ver tarefas</a>` : ''}<button type="button" class="danger" id="delete-record">Excluir</button></div></article>`;
}

async function render() {
  const version = ++renderVersion;
  const [route, query] = (location.hash.slice(1) || 'tasks').split('?');
  const [type, id, mode] = route.split('/');
  if (!['tasks', 'projects'].includes(type)) { location.hash = '#tasks'; return; }
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === type);
    if (link.dataset.nav === type) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  view.setAttribute('aria-busy', 'true');
  view.innerHTML = '<p class="loading">Carregando…</p>';
  try {
    const projects = await api('/projects');
    let record;
    let html;
    if (!id) {
      const records = isTask(type) ? await api('/tasks') : projects;
      html = listView(type, records, projects, new URLSearchParams(query).get('project'));
    } else {
      record = id === 'new' ? {} : await api(`/${type}/${encodeURIComponent(id)}`);
      html = id === 'new' || mode === 'edit' ? formView(type, record, projects) : detailView(type, record, projects);
    }
    if (version !== renderVersion) return;
    view.innerHTML = html;
    document.querySelector('#project-filter')?.addEventListener('change', event => { location.hash = `#tasks${event.target.value ? `?project=${event.target.value}` : ''}`; });
    document.querySelector('#record-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        const saved = await api(`/${type}${record._id ? `/${record._id}` : ''}`, { method: record._id ? 'PUT' : 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        notify('Registro salvo com sucesso.');
        location.hash = `#${type}/${saved._id}`;
      } catch (error) { notify(error.message, true); }
      finally { submit.disabled = false; }
    });
    document.querySelector('#delete-record')?.addEventListener('click', async event => {
      if (!confirm(`Excluir “${record.name}”? Esta ação não pode ser desfeita.`)) return;
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await api(`/${type}/${record._id}`, { method: 'DELETE' });
        notify('Registro excluído com sucesso.');
        location.hash = `#${type}`;
      } catch (error) { notify(error.message, true); button.disabled = false; }
    });
  } catch (error) {
    if (version !== renderVersion) return;
    notify(error.message, true);
    view.innerHTML = '<div class="empty"><h2>Não foi possível carregar os dados</h2><p>Verifique a conexão com a aplicação e tente novamente.</p><button id="retry">Tentar novamente</button></div>';
    document.querySelector('#retry').addEventListener('click', render);
  } finally { if (version === renderVersion) view.setAttribute('aria-busy', 'false'); }
}
window.addEventListener('hashchange', render);
render();
