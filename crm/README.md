# Sector: CRM & Clientes 360°

> Directiva asociada: [`/directives/build_crm.md`](/directives/build_crm.md)  
> Skills de sector: `customer_journey` · `lead_profiler` · `retention_guardian`

---

## Propósito del Sector

Centralizar el ciclo de vida de prospectos y clientes, evaluando el perfil y puntaje de oportunidad (*Lead Score*), gestionando el avance por etapas y monitoreando la salud de la cartera para evitar el riesgo de abandono (*churn*).

## Estructura del Sector

```text
crm/
├── README.md       # Documentación funcional y operacional del sector
├── index.html      # Tablero Kanban del pipeline y fichas 360°
└── crm.js          # Lógica de scoring, estados del embudo e interacciones
```

## Etapas del Funnel

- `PROS`: Prospecto inicial
- `CONT`: Contactado
- `CALI`: Calificado
- `PROP`: En Propuesta
- `GANA`: Ganado / Cliente activo
- `PERD`: Oportunidad perdida
