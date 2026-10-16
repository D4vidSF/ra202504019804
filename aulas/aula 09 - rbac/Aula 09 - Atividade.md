# HANDOUT — AULA 09

## Projete a Matriz de Acesso

*SisAcad — sistema acadêmico fictício — Arquitetura de Aplicações Web*

## 🎯 MISSÃO

Vocês são o time de segurança contratado para definir QUEM pode fazer O QUÊ no SisAcad, o novo sistema acadêmico da faculdade. Os papéis já existem: Aluno, Professor, Coordenador e Secretaria.

- Preencham a matriz abaixo com ✓ (pode) ou ✗ (não pode) para cada papel × ação
- Justifiquem por escrito os 3 casos que geraram mais discussão na dupla
- Respondam à pergunta-armadilha da Parte 03 — ela esconde o limite do modelo

*⏱️ Tempo: 25 minutos  |  👥 Formato: em duplas  |  Regra de ouro: na dúvida, NEGUE o acesso.*

> **Nomes:** David Silva Ferreira   **Turma:** ____________________   **Data:** 15 / 10 / 2026

## PARTE 01 — A matriz papel × permissão

Marquem ✓ (pode) ou ✗ (não pode) em cada célula:

| **Ação** | **Aluno** | **Professor** | **Coordenador** | **Secretaria** |
| --- | --- | --- | --- | --- |
| 1. Ver as próprias notas | ✓ | ✓* | ✓ | ✓ |
| 2. Ver notas de toda a turma | ✗ | ✓* | ✓ | ✓ |
| 3. Lançar nota | ✗ | ✓* | ✗ | ✗ |
| 4. Alterar nota já lançada | ✗ | ✓* | ✗ | ✗ |
| 5. Matricular aluno em disciplina | ✓ | ✓ | ✓ | ✓ |
| 6. Trancar matrícula | ✓ | ✗ | ✗ | ✓ |
| 7. Criar nova disciplina | ✗ | ✗ | ✓ | ✓ |
| 8. Ver dados pessoais de aluno | ✓ | ✗ | ✓ | ✓ |
| 9. Emitir histórico escolar | ✓ | ✗ | ✗ | ✓ |
| 10. Aprovar colação de grau | ✗ | ✗ | ✓ | ✓ |

*Dica: pensem em consequências — quem responde perante o MEC se uma nota for alterada indevidamente? E perante a LGPD se dados pessoais vazarem?*

## PARTE 02 — Os casos polêmicos

Quais 3 células geraram mais discussão na dupla? Anotem a célula (ação + papel) e a justificativa da decisão final:

1. Caso 1: Alterar nota já lançada
O professor pode alterar notas apenas nas turmas e disciplinas pelas quais é responsável. Após o fechamento do período, a alteração deveria exigir justificativa, manter registro de auditoria e, dependendo da regra institucional, passar pela aprovação da coordenação ou da secretaria.

2. Caso 2: Aprovar colação de grau
O coordenador pode participar da aprovação acadêmica, verificando o cumprimento dos requisitos curriculares. Porém, a conclusão também depende da validação administrativa da secretaria, como documentação, carga horária e situação regular do aluno.

3. Caso 3: Matricular aluno em disciplina
O aluno pode solicitar ou realizar a própria matrícula, respeitando pré-requisitos, vagas e prazos. A secretaria pode efetivá-la ou ajustá-la. Professor e coordenador não deveriam matricular livremente: no máximo, poderiam autorizar exceções dentro de sua competência.

## PARTE 03 — A pergunta-armadilha

Vocês marcaram que Professor pode “lançar nota”. Mas… de QUALQUER turma? O professor de Cálculo pode lançar nota na turma de Arquitetura de Aplicações Web?

Não, ele não pode. Precisa ter uma hierarquia das materias também, para cada professor ver somente as materias e turmas que ele participa. Por esse motivo respondi ✓*. 

1. O papel “Professor” sozinho é suficiente para decidir esse acesso? Por quê?

Não, precisa que o coordenardo aloque-o dentro da materia.

2. Que informação ALÉM do papel o sistema precisa conhecer para decidir corretamente?

-> identidade do professor;
-> disciplina e a turma solicitadas;
-> vínculo do professor com essa turma;
-> período letivo;
-> curso ou departamento;
-> status da turma e do lançamento de notas;
-> eventuais delegações ou autorizações excepcionais.

3. Onde vocês já viram esse mesmo problema nesta disciplina? (dica: Aula 07…)

Esse é o problema da autorização baseada apenas em papéis, ou RBAC (Role-Based Access Control). O papel concede uma permissão geral, mas o sistema também precisa verificar o recurso específico e a relação do usuário com ele. Isso pode ser tratado como controle de acesso baseado em atributos, ABAC (Attribute-Based Access Control), ou por uma combinação de RBAC + atributos/contexto.

## DESAFIO

1. Chegou um pedido da coordenação: criar o papel “Monitor” — um aluno que ajuda o professor em uma disciplina. Que permissões vocês dariam ao Monitor? Que risco novo esse papel cria?

O principal risco é a elevação indevida de privilégios, pois o Monitor continua sendo aluno e passa a ter acesso a informações ou funções relacionadas aos colegas. Isso pode causar vazamento de notas e dados pessoais, favorecimento, conflitos de interesse ou alterações indevidas. Para reduzir o risco, o acesso deve ser limitado à turma específica, seguir o princípio do menor privilégio, ter prazo de validade e manter logs de auditoria.
