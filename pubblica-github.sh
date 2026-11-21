#!/bin/bash
# Pubblica il sito su GitHub Pages, tutto in una volta:
#   1. accesso a GitHub (la prima volta: premi Invio e approva nel browser)
#   2. crea il repo pubblico 1thing-sito, se non c'è, e fa il push
#   3. accende Pages (sorgente: GitHub Actions) e imposta il dominio 1thingapp.com
#   4. aspetta la prima pubblicazione
# Si può rilanciare: salta i passi già fatti.
set -euo pipefail
cd "$(dirname "$0")"
REPO=1thing-sito
DOMINIO=1thingapp.com

echo "== 1. accesso a GitHub"
if ! gh auth status >/dev/null 2>&1; then
  gh auth login --hostname github.com --git-protocol ssh --skip-ssh-key --web --scopes workflow
fi
UTENTE=$(gh api user --jq .login)
echo "   account: $UTENTE"

echo "== 2. repo e push"
if gh repo view "$UTENTE/$REPO" >/dev/null 2>&1; then
  echo "   il repo $UTENTE/$REPO esiste già"
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "git@github.com:$UTENTE/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" --public --description "Il sito di 1thing: un obiettivo al giorno." --source . --remote origin --push
fi

echo "== 3. Pages e dominio"
if ! gh api "repos/$UTENTE/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$UTENTE/$REPO/pages" -f build_type=workflow >/dev/null
  echo "   Pages acceso (sorgente: GitHub Actions)"
fi
gh api -X PUT "repos/$UTENTE/$REPO/pages" -f build_type=workflow -f cname="$DOMINIO" >/dev/null
echo "   dominio: $DOMINIO"

echo "== 4. prima pubblicazione"
sleep 5
gh workflow run pages.yml --repo "$UTENTE/$REPO" >/dev/null 2>&1 || true
sleep 5
RUN=$(gh run list --repo "$UTENTE/$REPO" --workflow pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN" --repo "$UTENTE/$REPO" --exit-status
echo
echo "fatto. indirizzo di prova: https://$UTENTE.github.io/$REPO/"
echo "per il dominio, presso il registrar: 4 record A (185.199.108.153, .109.153, .110.153, .111.153) e CNAME www -> $UTENTE.github.io"
