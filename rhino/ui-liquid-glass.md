# Liquid glass — audit UI mobilu (2026-09-15 14:49)

Pracovní kopie: `/Users/martin.polak/Projects/ksirovka-app2/ksirovka-app`  
SDK: Expo 54 → praktický nástroj je `expo-blur` (`BlurView`), ne iOS 26 Liquid Glass API.

## Jak je rozhraní postavené

```
Screen = LinearGradient forest950 → forest900 → forest950
       + SafeArea (top/left/right)
       + children v jednom sloupci (padding 20 / 24)
```

Pozadí je téměř jednolitý tmavozelený přechod. Žádná fotka hřiště, mapa ani vzor. `Header` **nemá** `backgroundColor` — gradient jím prosvítá už teď.

Karty (`Card.tsx`) jsou neprůhledné desky: `rgba(38, 68, 53, 0.85)` + 1px `rgba(255,255,255,0.1)`. Leží **v** ScrollView, nic pod nimi neprojíždí.

Žádný overlay nemá `position: 'absolute'`. Lišty obsah „nezakrývají“ — **ukrajují** výšku scrollu.

## Kde sklo dává smysl (obsah by jel pod lištou)

### 1. Scorecard — spodní chrom (priorita 1)
`app/scorecard.tsx` sloupec:

1. Header + progress + hole nav (natrvalo nahoře, v toku)
2. `ScrollView` (skóre + mřížka 18 jamek) — `flex: 1`
3. `LiveStandings` — `rgba(38, 68, 53, 0.95)`, skoro plná deska
4. Akce (Ukončit / Předčasně / Zrušit)

Pořadí a mřížka jamek končí **nad** lištou. Sklo tady něco odhalí, jen když se 3+4 připnou dolů (`absolute` / overlay) a ScrollView půjde až pod safe area. Pak pod sklem pojedou jamkové tečky a řádky hráčů.

`expo-blur`: `BlurView` musí být **až po** ScrollView v stromu (známý bug — blur se neobnoví, když je nad dynamickým obsahem).

### 2. Scorecard — horní chrom (priorita 2)
Header + progress + „Jamka N / Par“ ukrajují dalších ~140 px. Sticky glass nahoře by nechal scrollovat skóre pod názvem jamky. Header je už vizuálně průhledný; chybí blur a pin.

### 3. Žebříčky — filtry období (priorita 3)
`app/records.tsx`: chipy Den/Týden/Měsíc/Rok a typ hry jsou **uvnitř** ScrollView. Při scrollu odjedou. Sticky glass pod Headerem by držel filtry a pod nimi by jely karty žebříčku.

## Kde sklo teď nic neodhalí

| Místo | Proč |
| --- | --- |
| Home karta „O Kšírovce“ | Pod kartou je jen stejný gradient |
| Nové kolo / Historie / About / Login karty | Totéž — stacked cards, žádný overlay |
| `Button` primary (zlato) | Má zůstat plný, ne skleněný |
| `GameScorecard` buňky | Jsou obsah, ne chrom |

Až bude pod gradientem fotka areálu nebo vzor, dává smysl i `Card` jako `systemUltraThinMaterialDark`. Teď by to bylo jen mlžné zelené na zelené.

## Rozhodnutí k implementaci (ještě neuděláno)

1. Nejdřív scorecard: pin `LiveStandings` + akce, `BlurView` tint `dark` / `systemThinMaterialDark`, ScrollView s `contentInset` / `paddingBottom` = výška lišty.
2. Header scorecard stejně, až bude vidět, že pod spodem něco jede.
3. `Card` nechat, dokud nebude bohatší pozadí.
4. Android: `experimentalBlurMethod` až po iOS ověření; default je poloprůhledný fallback.
