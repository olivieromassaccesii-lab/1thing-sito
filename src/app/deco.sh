#!/bin/bash
# deco.sh <stile>: scrive le decorazioni dello studio e riapre l'app
U=3C421A5F-D1B1-49DA-B598-90E45791C07B
xcrun simctl terminate $U com.poppi.1thing 2>/dev/null
declare -a K=(soffitto pareti tende lucine davanzale mensola parete scrivania sottotavolo angolo tappeto cuccia)
case $1 in
 partenza) V=(niente tinta rosa niente basilico niente niente niente niente niente rosa niente);;
 autunno) V=(lanterna legno rosa lampadine geranio candela cucu tazza gomitoli scala juta plaid);;
 primavera) V=(nuvole fiori fiori bandierine lavanda rampicante ghirlanda fiori pouf monstera rosa cuscino);;
 mare) V=(acchiappasogni azzurre azzurre niente cactus tazze mappa libri dischi lampada blu cesta);;
 serra) V=(pianta salvia salvia lampadine felce rampicante bacheca fiori libri monstera scacchi cesta);;
esac
for i in ${!K[@]}; do xcrun simctl spawn $U defaults write com.poppi.1thing studio.deco.${K[$i]} ${V[$i]}; done
xcrun simctl spawn $U defaults write com.poppi.1thing debug.moment giorno
xcrun simctl launch $U com.poppi.1thing >/dev/null
sleep 5
