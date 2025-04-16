# Dokumentation - Veidekke Verktygshanteringssystem

## Statushantering

Systemet använder tre olika status för verktyg:

1. **available** - Visas som "Tillgänglig" i användargränssnittet
2. **borrowed** - Visas som "Används" i användargränssnittet (tidigare "Utlånad")
3. **broken** - Visas som "Trasig" i användargränssnittet

### Intern lagring vs. visning

* I databasen (Supabase) lagras statusvärden alltid som engelska termer: "available", "borrowed", "broken"
* I användargränssnittet visas statusen på svenska som: "Tillgänglig", "Används", "Trasig"

### Statusflöde

När en användare klickar på statusikonen för ett verktyg ändras status enligt följande flöde:
* Tillgänglig → Används
* Används → Trasig
* Trasig → Tillgänglig

### Teknisk implementation

Mappningen mellan interna värden och visat gränssnitt sker i följande funktioner:

1. I `renderTools()` funktion (script.js, runt rad 280) definieras statustext:
   ```javascript
   switch(tool.status) {
       case 'available':
           statusClass = 'status-available';
           statusText = 'Tillgänglig';
           nextStatus = 'borrowed';
           break;
       case 'borrowed':
           statusClass = 'status-borrowed';
           statusText = 'Används';  // Tidigare "Utlånad", nu ändrat till "Används"
           nextStatus = 'broken';
           break;
       case 'broken':
           statusClass = 'status-broken';
           statusText = 'Trasig';
           nextStatus = 'available';
           break;
       default:
           statusClass = 'status-available';
           statusText = 'Tillgänglig';
           nextStatus = 'borrowed';
   }
   ```

2. I formuläret för att lägga till/redigera verktyg (index.html, runt rad 190):
   ```html
   <select id="tool-status" required>
       <option value="available">Tillgänglig</option>
       <option value="borrowed">Används</option>
       <option value="broken">Trasig</option>
   </select>
   ```

3. När statusen uppdateras skickas det interna värdet till databasen i `quickUpdateStatus()` (script.js, runt rad 1135):
   ```javascript
   // Uppdatera verktygets status i Supabase
   const { error } = await supabase
       .from('tools')
       .update({ 
           status: newStatus,
           updated: new Date().toISOString() 
       })
       .eq('id', toolId);
   ```

4. När ett nytt verktyg sparas eller ett befintligt uppdateras i `saveTool()` funktion (script.js, runt rad 915):
   ```javascript
   // Hämta värden från formuläret
   const status = document.getElementById('tool-status').value;
   
   // Skicka till Supabase
   // För nytt verktyg:
   const newTool = {
       // ...andra egenskaper
       status,
       // ...
   };
   
   // För uppdatering:
   const { error } = await supabase
       .from('tools')
       .update({ 
           // ...andra egenskaper 
           status,
           // ... 
       })
       .eq('id', id);
   ```

## CSS-klasser för status

Varje status har en egen CSS-klass med olika färger:

```css
.status-available {
    background-color: #dcfce7;
    color: var(--success-color);
}

.status-borrowed {
    background-color: #fef3c7;
    color: var(--warning-color);
}

.status-broken {
    background-color: #fee2e2;
    color: var(--danger-color);
}
```
```

Detta dokument förklarar hur statushanteringen fungerar i applikationen, med fokus på ändringen från "Utlånad" till "Används" som du bad om. Den innehåller information om:

1. Vilka status som finns i systemet
2. Hur de lagras i databasen vs. hur de visas i gränssnittet
3. Hur statusflödet fungerar när användaren klickar
4. Var i koden statusmappningen sker
5. CSS-stilar för de olika statusarna

Dokumentet kan fungera som en referens för andra utvecklare som ska arbeta med koden i framtiden.