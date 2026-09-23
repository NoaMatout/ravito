#!/bin/sh
# Verifie qu'un site assemble contient tous les fichiers que sa page reference.
#
# Une publication precedente etait verte et la page etait nue : le workflow
# copiait index.html et dist/, jamais assets/, donc la feuille de style et la
# police repondaient 404 sans que rien n'echoue. Ce script est la reponse, et
# le workflow lui efface un fichier juste apres pour verifier qu'il sait
# encore refuser.
#
#   tools/verifier-site.sh _site
#
# Sort 0 si tout est la, 1 sinon, et nomme ce qui manque.
set -eu

site=${1:-_site}
page=${2:-index.html}
manque=0

for f in $(grep -oE '(href|src)="\./[^"]+"' "$page" \
           | sed -E 's/.*"\.\/([^"]+)"/\1/' | sort -u); do
  if [ -e "$site/$f" ]; then
    echo "  ok       $f"
  else
    echo "  MANQUANT $f"
    manque=1
  fi
done

if [ "$manque" -ne 0 ]; then
  echo "$page reference des fichiers absents de $site." >&2
  exit 1
fi
