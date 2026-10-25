-- DATOS DE DEMOSTRACIÓN — reemplazar por los datos reales del gimnasio antes de producción.
insert into organizations(id,name,slug,brand) values
 ('00000000-0000-0000-0000-000000000001','STARFIT GYM','starfit','{"primary":"#C9FF43"}');
insert into gym_locations(id,organization_id,name,address,city,capacity) values
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000001','Sede Pardo','Cruce de Ppao','Nuevo Chimbote',80),
 ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-000000000001','Sede Agraria','Av. Naciones Unidas con Av. Agraria','Nuevo Chimbote',80);
insert into membership_plans(organization_id,name,period,duration_days,price_cents,terms,is_demo) values
 ('00000000-0000-0000-0000-000000000001','Mensual [DEMO]','monthly',30,0,'Precio por confirmar por el gimnasio. Sin renovación automática.',true),
 ('00000000-0000-0000-0000-000000000001','Trimestral [DEMO]','quarterly',90,0,'Precio por confirmar por el gimnasio. Sin renovación automática.',true);
insert into training_zones(location_id,name,kind,description,map_shape) values
 ('00000000-0000-0000-0000-0000000000a1','Cardio [DEMO]','cardio','Zona de ejemplo','{"x":2,"y":2,"w":40,"h":24}'),
 ('00000000-0000-0000-0000-0000000000a1','Fuerza [DEMO]','strength','Zona de ejemplo','{"x":44,"y":2,"w":54,"h":34}'),
 ('00000000-0000-0000-0000-0000000000a1','Funcional [DEMO]','functional','Zona de ejemplo','{"x":2,"y":28,"w":40,"h":30}'),
 ('00000000-0000-0000-0000-0000000000a1','Recepción [DEMO]','reception','Zona de ejemplo','{"x":44,"y":38,"w":54,"h":20}');
