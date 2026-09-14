# Master API Guide

Generated from `Master_APIs.json` on 2026-09-14T11:49:12.315Z.

This guide groups master APIs by app and module, then lists each API with its service key, SQL, and description.

## App: ai

### Module: ai-services

#### ai.agent.categories

**Service Key:** `ai.agent.categories`

**Description:** Retrieves Ai Agent Category records.

**SQL:**

```sql
select * from app_fd_ai_agent_category
```

#### ai.agent.list

**Service Key:** `ai.agent.list`

**Description:** Retrieves Ai Agent records.

**SQL:**

```sql
select * from app_fd_ai_agent
```

#### ai.provider.list

**Service Key:** `ai.provider.list`

**Description:** Retrieves Ai Provider records.

**SQL:**

```sql
select * 
  from app_fd_ai_provider
```

#### ai.task.by.agent

**Service Key:** `ai.task.by.agent`

**Description:** Retrieves Ai Agent Task records.

**SQL:**

```sql
select * from app_fd_ai_agent_task where c_agent=?
```

### Module: process-configuration

#### ai.agent.list

**Service Key:** `ai.agent.list`

**Description:** Retrieves Ai Agent records.

**SQL:**

```sql
select * from app_fd_ai_agent
```

#### ai.task.by.agent

**Service Key:** `ai.task.by.agent`

**Description:** Retrieves Ai Agent Task records.

**SQL:**

```sql
select * from app_fd_ai_agent_task where c_agent=?
```

## App: app-builder

### Module: content-management

#### sys.app.builder.modules

**Service Key:** `sys.app.builder.modules`

**Description:** Retrieves App Builder Module records.

**SQL:**

```sql
select * from app_fd_app_builder_module where c_app_id = ?
```

### Module: unknows

#### sys.app.authorization

**Service Key:** `sys.app.authorization`

**Description:** Retrieves Authorization records.

**SQL:**

```sql
select id,c_title as c_name from app_fd_authorization
```

#### sys.app.data

**Service Key:** `sys.app.data`

**Description:** Retrieves App Builder records.

**SQL:**

```sql
select * from app_fd_app_builder
```

#### sys.app.datalist

**Service Key:** `sys.app.datalist`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id,c_name,c_db_column from app_fd_app_datalist
```

#### sys.app.forms

**Service Key:** `sys.app.forms`

**Description:** Retrieves App Form records ordered in SQL.

**SQL:**

```sql
select id, c_name, c_form_key from app_fd_app_form
order by c_name
```

#### sys.app.menus

**Service Key:** `sys.app.menus`

**Description:** Retrieves App Menu records.

**SQL:**

```sql
select id,c_name from app_fd_app_menu
```

#### sys.app.pages

**Service Key:** `sys.app.pages`

**Description:** Retrieves Pages records.

**SQL:**

```sql
select id,c_name from app_fd_pages
```

## App: authorization

### Module: unknows

#### sys.user.selected.authorization

**Service Key:** `sys.user.selected.authorization`

**Description:** Retrieves Authorization records by ID.

**SQL:**

```sql
select * from app_fd_authorization where id = ?
```

## App: bpm

### Module: camunda

#### bpm.history.activity.performance

**Service Key:** `bpm.history.activity.performance`

**Description:** Retrieves Task History records grouped in SQL, ordered in SQL.

**SQL:**

```sql
SELECT 
  c_process_definition_key,
  c_task_name,
  AVG(EXTRACT(EPOCH FROM (
    to_timestamp(c_completed_time::BIGINT / 1000) -
    to_timestamp(c_created_time::BIGINT / 1000)
  ))) AS avg_activity_seconds
FROM app_fd_task_history
WHERE c_completed_time IS NOT NULL
  AND to_timestamp(c_completed_time::BIGINT / 1000) BETWEEN ? AND ?
  AND c_process_definition_key IN (#IN_FILTER#)
GROUP BY c_task_name, c_process_definition_key
ORDER BY avg_activity_seconds DESC;
```

#### bpm.history.compliance.rate

**Service Key:** `bpm.history.compliance.rate`

**Description:** Retrieves Task History records with an aggregate count, grouped in SQL.

**SQL:**

```sql
SELECT 
  c_process_definition_key,
  SUM(CASE 
        WHEN EXTRACT(EPOCH FROM (
          to_timestamp(c_completed_time::BIGINT / 1000) -
          to_timestamp(c_created_time::BIGINT / 1000)
        )) <= 86400 THEN 1 ELSE 0 END
      ) * 100.0 / COUNT(*) AS sla_compliance_percent
FROM app_fd_task_history
WHERE c_completed_time IS NOT NULL
  AND to_timestamp(c_completed_time::BIGINT / 1000) BETWEEN ? AND ?
  AND c_process_definition_key IN (#IN_FILTER#)
GROUP BY c_process_definition_key;
```

#### bpm.history.cycle.time

**Service Key:** `bpm.history.cycle.time`

**Description:** Retrieves Task History, Process Map records grouped in SQL.

**SQL:**

```sql
SELECT 
  m.c_title,
  c_process_definition_key,
  AVG(EXTRACT(EPOCH FROM (
    to_timestamp(c_completed_time::BIGINT / 1000) -
    to_timestamp(c_created_time::BIGINT / 1000)
  ))) AS avg_cycle_seconds
FROM app_fd_task_history h  
  JOIN app_fd_process_map m on m.c_process_key = h.c_process_definition_key
WHERE c_completed_time IS NOT NULL
  AND to_timestamp(c_completed_time::BIGINT / 1000) BETWEEN ? AND ?
  AND c_process_definition_key IN (#IN_FILTER#)
GROUP BY c_process_definition_key, m.c_title;
```

#### bpm.history.failure.trend

**Service Key:** `bpm.history.failure.trend`

**Description:** Retrieves Task History records with an aggregate count, grouped in SQL, ordered in SQL.

**SQL:**

```sql
SELECT 
  c_process_definition_key,
  c_event,
  COUNT(*) AS event_count,
  DATE_TRUNC('day', to_timestamp(c_created_time::BIGINT / 1000)) AS day
FROM app_fd_task_history
WHERE c_event IN ('error', 'incident', 'escalation')
  AND to_timestamp(c_created_time::BIGINT / 1000) BETWEEN ? AND ?
  AND c_process_definition_key IN (#IN_FILTER#)
GROUP BY c_process_definition_key, c_event, day
ORDER BY day;
```

#### bpm.history.throughput

**Service Key:** `bpm.history.throughput`

**Description:** Retrieves Task History records with an aggregate count, grouped in SQL, ordered in SQL.

**SQL:**

```sql
SELECT 
  c_process_definition_key,
  DATE_TRUNC('day', to_timestamp(c_completed_time::BIGINT / 1000)) AS day,
  COUNT(*) AS completed_instances
FROM app_fd_task_history
WHERE c_completed_time IS NOT NULL
  AND to_timestamp(c_completed_time::BIGINT / 1000) BETWEEN ? AND ?
  AND c_process_definition_key IN (#IN_FILTER#)
GROUP BY c_process_definition_key, day
ORDER BY day;
```

#### bpm.list.pending.draft

**Service Key:** `bpm.list.pending.draft`

**Description:** Retrieves Process Start Draft records.

**SQL:**

```sql
select * from app_fd_process_start_draft
WHERE c_requester = '#currentUser.username#'
and c_status not in ('CANCELLED', 'STARTED')
```

#### cam.current.user

**Service Key:** `cam.current.user`

**Description:** Retrieves Act Id User records.

**SQL:**

```sql
SELECT id_ AS user_id, 
substring(id_, length('#HOST_DB#') + 2, length(id_) ) AS user_name
FROM act_id_user
WHERE id_ LIKE '#HOST_DB#:#currentUser.username#' 
```

#### cam.get.task

**Service Key:** `cam.get.task`

**Description:** Retrieves Act Ge Bytearray, Act Ru Variable, Act Hi Procinst, Act Ru Task, Act Re Procdef, Act Id Tenant Member records ordered in SQL.

**SQL:**

```sql
SELECT task.tenant_id_, task.id_ AS id, process.proc_inst_id_ AS instance_id, process.state_ AS state, task.task_def_key_ AS task_def_key, 
COALESCE(task.name_, '') AS task_name, task.description_ AS description, process.start_time_ AS start_time, process.end_time_,
task.create_time_ AS date_created, task.due_date_ AS due_date, task.follow_up_date_ AS followup,
task.owner_ AS OWNER, task.priority_ AS priority, process.proc_def_key_ AS process_def_key, 
process.proc_def_key_ AS proc_def_key,  process.business_key_ AS business_key, process.proc_def_id_ AS proc_def_id
, arp.name_ AS process_name,
task.assignee_ AS assignee,
(select  
jsonb_object_agg(name_, case when type_ in ('json')
                 then (select encode(bytes_, 'escape') as text 
                       from act_ge_bytearray ba where ba.id_=bytearray_id_) 
                 when type_ in ('integer','boolean','long', 'date') then long_::text
                 when type_ in ('double', 'short') then double_::text
                 else text_ end) from act_ru_variable 
                 where proc_inst_id_=process.proc_inst_id_
) as variables
FROM act_hi_procinst process
JOIN act_ru_task task ON
    task.proc_inst_id_ = process.id_
JOIN act_re_procdef AS arp ON
task.proc_def_id_ = arp.id_
LEFT JOIN act_id_tenant_member AS m
ON m.user_id_ = task.assignee_
WHERE task. Assignee_ = '#currentUser.username#' and task.id_=?
ORDER BY date_created DESC;
```

#### cam.instance.history

**Service Key:** `cam.instance.history`

**Description:** <p>Process Instance History for Tenant DB</p>

**SQL:**

```sql
SELECT 
    id, 
    c_process_instance_id,
    c_event, 
    c_task_name, 
    c_task_type, 
    c_assignee, 
    c_business_key, 
    c_audit_data,
to_char(to_timestamp(c_assigned_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS assigned_time,
   to_char(to_timestamp(c_completed_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS completed_time,
    to_char(to_timestamp(c_created_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS created_time
FROM app_fd_task_history
WHERE c_process_instance_id=? and c_task_type in ('userTask', 'startEvent', 'endEvent') 
ORDER BY datecreated DESC;
```

#### cam.process.attachment

**Service Key:** `cam.process.attachment`

**Description:** Retrieves Process Attachments records ordered in SQL.

**SQL:**

```sql
select * from app_fd_process_attachments
where c_business_key = ? 
and c_process_key = ?
order by datecreated desc
```

#### cam.process.comments

**Service Key:** `cam.process.comments`

**Description:** Retrieves Process Comments records ordered in SQL.

**SQL:**

```sql
select * from app_fd_process_comments
where c_business_key = ? 
and c_process_key = ?
order by datecreated desc
```

#### cam.user.task.history

**Service Key:** `cam.user.task.history`

**Description:** Retrieves Task History records ordered in SQL.

**SQL:**

```sql
SELECT 
    id, 
    c_process_instance_id,
    c_event, 
    c_task_name, 
    c_task_type, 
    c_assignee, 
    c_business_key, 
    c_audit_data,
    to_char(to_timestamp(c_created_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS created_time,
  to_char(to_timestamp(c_assigned_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS assigned_time,
  to_char(to_timestamp(c_completed_time::bigint / 1000), 'YYYY-MM-DD HH24:MI:SS.MS') AS completed_time
FROM app_fd_task_history
where c_task_type = 'startEvent' and c_assignee = '#currentUser.username#'
ORDER BY datemodified ASC;
```

#### process.business.area

**Service Key:** `process.business.area`

**Description:** Retrieves Business Area records.

**SQL:**

```sql
select * from app_fd_business_area
```

#### process.category

**Service Key:** `process.category`

**Description:** Retrieves Process Category records.

**SQL:**

```sql
select id, c_key, c_title from app_fd_process_category
```

#### process.map

**Service Key:** `process.map`

**Description:** Retrieves Process Map records.

**SQL:**

```sql
SELECT *
FROM app_fd_process_map;
```

### Module: data-management

#### process.category

**Service Key:** `process.category`

**Description:** Retrieves Process Category records.

**SQL:**

```sql
select id, c_key, c_title from app_fd_process_category
```

### Module: process-configuration

#### process.business.area

**Service Key:** `process.business.area`

**Description:** Retrieves Business Area records.

**SQL:**

```sql
select * from app_fd_business_area
```

#### process.category

**Service Key:** `process.category`

**Description:** Retrieves Process Category records.

**SQL:**

```sql
select id, c_key, c_title from app_fd_process_category
```

#### process.gov

**Service Key:** `process.gov`

**Description:** Retrieves Process Gov records.

**SQL:**

```sql
select * from app_fd_process_gov
```

#### process.map

**Service Key:** `process.map`

**Description:** Retrieves Process Map records.

**SQL:**

```sql
SELECT *
FROM app_fd_process_map;
```

### Module: process-simulator

#### list.simulation.scenarios

**Service Key:** `list.simulation.scenarios`

**Description:** Retrieves Simulation Scenarios records.

**SQL:**

```sql
select * from app_fd_simulation_scenarios
```

#### process.map

**Service Key:** `process.map`

**Description:** Retrieves Process Map records.

**SQL:**

```sql
SELECT *
FROM app_fd_process_map;
```

### Module: unknows

#### cam.inquiry.details

**Service Key:** `cam.inquiry.details`

**Description:** Retrieves Inquiry records by ID.

**SQL:**

```sql
SELECT * FROM app_fd_inquiry WHERE id = ?;
```

#### cam.list.all.users

**Service Key:** `cam.list.all.users`

**Description:** Retrieves Act Id User records.

**SQL:**

```sql
SELECT id_ AS user_id, 
substring(id_, length('#HOST_DB#') + 2, length(id_) ) AS user_name
FROM act_id_user
WHERE id_ LIKE '#HOST_DB#:' || '%'
```

#### cam.list.my.tasks

**Service Key:** `cam.list.my.tasks`

**Description:** Retrieves Act Ge Bytearray, Act Ru Variable, Act Hi Procinst, Act Ru Task, Act Re Procdef, Act Id Tenant Member records ordered in SQL.

**SQL:**

```sql
SELECT task.tenant_id_, task.id_ AS id, process.proc_inst_id_ AS instance_id, process.state_ AS state, task.task_def_key_ AS task_def_key, 
COALESCE(task.name_, '') AS task_name, task. Description_ AS description, process.start_time_ AS start_time, process.end_time_,
task.create_time_ AS date_created, task.due_date_ AS due_date, task.follow_up_date_ AS followup,
task.owner_ AS OWNER, task.priority_ AS priority, process.proc_def_key_ AS process_def_key, 
process.proc_def_key_ AS proc_def_key,  process.business_key_ AS business_key, process.proc_def_id_ AS proc_def_id
, arp.name_ AS process_name,
task.assignee_ AS assignee,
(select  
jsonb_object_agg(name_, case when type_ in ('json')
                 then (select encode(bytes_, 'escape') as text 
                       from act_ge_bytearray ba where ba.id_=bytearray_id_) 
                 when type_ in ('integer','boolean','long', 'date') then long_::text
                 when type_ in ('double', 'short') then double_::text
                 else text_ end) from act_ru_variable 
                 where proc_inst_id_=process.proc_inst_id_
) as variables
FROM act_hi_procinst process
JOIN act_ru_task task ON
    task.proc_inst_id_ = process.id_
JOIN act_re_procdef AS arp ON
task.proc_def_id_ = arp.id_
LEFT JOIN act_id_tenant_member AS m
ON m.user_id_ = task. Assignee_
WHERE 
  task.tenant_id_ = '#HOST_DB#'  #IN_FILTER#
ORDER BY date_created DESC;
```

#### cam.list.task.all

**Service Key:** `cam.list.task.all`

**Description:** Retrieves Act Ge Bytearray, Act Ru Variable, Act Hi Procinst, Act Ru Task, Act Re Procdef, Act Id Tenant Member records ordered in SQL.

**SQL:**

```sql
SELECT task.tenant_id_, task.id_ AS id, process.proc_inst_id_ AS instance_id, process.state_ AS state, task.task_def_key_ AS task_def_key, 
COALESCE(task.name_, '') AS task_name, task.description_ AS description, process.start_time_ AS start_time, process.end_time_,
task.create_time_ AS date_created, task.due_date_ AS due_date, task.follow_up_date_ AS followup,
task. Owner_ AS OWNER, task.priority_ AS priority, process.proc_def_key_ AS proc_def_key, process.business_key_ AS business_key, process.proc_def_id_ AS proc_def_id
, arp.name_ AS process_name,
task.assignee_ AS assignee,
(select  
jsonb_object_agg(name_, case when type_ in ('json')
				 then (select encode(bytes_, 'escape') as text 
					   from act_ge_bytearray ba where ba.id_=bytearray_id_) 
				 when type_ in ('integer','boolean','long', 'date') then long_::text
				 when type_ in ('double', 'short') then double_::text
				 else text_ end) from act_ru_variable 
                 where proc_inst_id_=process.proc_inst_id_
) as variables
FROM act_hi_procinst process
JOIN act_ru_task task ON
    task.proc_inst_id_ = process.id_
JOIN act_re_procdef AS arp ON
task.proc_def_id_ = arp.id_
LEFT JOIN act_id_tenant_member AS m
ON
m.user_id_ = task. Assignee_
where  task.tenant_id_ = '#HOST_DB#' #IN_FILTER# 
AND process.state_='ACTIVE'
ORDER BY date_created DESC;
```

#### cam.operator.org

**Service Key:** `cam.operator.org`

**Description:** Retrieves Operator records.

**SQL:**

```sql
SELECT id, c_name || ', ' || c_city AS c_name, 
case when o.c_contact_person is null or  trim(o.c_contact_person)=''
then o.c_auth_person else o.c_contact_person end as c_contact_person,
case when o.c_mobile is null or  trim(o.c_mobile)=''
then o.c_contact_no else o.c_mobile end as c_contact_no
FROM app_fd_operator as o
```

#### cam.process.stats

**Service Key:** `cam.process.stats`

**Description:** Retrieves Act Re Procdef, Act Hi Procinst, Process Data, Act Ru Task records with an aggregate count, grouped in SQL, ordered in SQL.

**SQL:**

```sql
SELECT d.key_ process_def_key, d.name_ as process_name, count(task.id_) as task_count
FROM act_re_procdef d 
LEFT JOIN act_hi_procinst process ON d.id_=process.proc_def_id_
LEFT JOIN app_fd_process_data request on  process.business_key_ = request.c_business_key and request.createdby LIKE '#HOST_NAME#' || '%'
LEFT JOIN act_ru_task task ON
    task.proc_inst_id_ = process.id_
group by d.key_, d.name_
order by d.name_
```

#### check.process.auth

**Service Key:** `check.process.auth`

**Description:** Retrieves Process Map, App Form, Process Category, Directory User, Directory User Group, Directory Group records.

**SQL:**

```sql
SELECT pm.c_process_key, pm.c_title
FROM app_fd_process_map AS pm
JOIN app_fd_app_form AS af ON
af.id::text = pm.c_form_id
JOIN app_fd_process_category AS pc ON
pc.c_key = pm.c_category
join dir_user u on u.username='#currentUser.username#'
JOIN dir_user_group ug on ug.userid=u.id
JOIN dir_group g on g.id::text=ug.groupid
WHERE pm.c_is_active = 'YES' 
and pm.c_channel like '%' || '#CHANNEL_ID#'|| '%' 
and pm.c_group like '%' || g.id || '%'
and pm.c_process_key=?
```

#### list.governing.bodies

**Service Key:** `list.governing.bodies`

**Description:** Retrieves Governing Bodies records.

**SQL:**

```sql
select * from app_fd_governing_bodies
```

#### list.simulation.events

**Service Key:** `list.simulation.events`

**Description:** Retrieves Simulation Events records.

**SQL:**

```sql
select * from app_fd_simulation_events
```

#### list.simulation.runs

**Service Key:** `list.simulation.runs`

**Description:** Retrieves Simulation Runs records.

**SQL:**

```sql
select * from app_fd_simulation_runs
```

## App: content.management

### Module: content-management

#### check.slug.exists

**Service Key:** `check.slug.exists`

**Description:** Retrieves App Link records for a channel.

**SQL:**

```sql
SELECT *
FROM app_fd_app_link
WHERE c_channel_id = ?
AND c_slug = ?;
```

#### list.content.revisions

**Service Key:** `list.content.revisions`

**Description:** Retrieves Content Revision records for a content item, ordered in SQL.

**SQL:**

```sql
SELECT id, datecreated, c_content
FROM app_fd_content_revision
WHERE c_content_id = ?
ORDER BY datecreated DESC;
```

#### list.post.revisions

**Service Key:** `list.post.revisions`

**Description:** Retrieves Post Revision records for a post, ordered in SQL.

**SQL:**

```sql
SELECT id, datecreated, c_post
FROM app_fd_post_revision
WHERE c_post_id = ?
ORDER BY datecreated DESC;
```

### Module: unknows

#### sys.get.page.slug

**Service Key:** `sys.get.page.slug`

**Description:** Retrieves App Link, Pages, Styles records.

**SQL:**

```sql
SELECT p.*, s.c_css_styles
FROM app_fd_app_link f 
JOIN app_fd_pages p ON p.id::text = f.c_feature_key
left JOIN app_fd_styles s on s.id::text= p.c_styles
WHERE f.c_channel_id='#CHANNEL_ID#' and f.c_slug = ?;
```

## App: Delete All content Revisions

### Module: content-management

#### delete.all.content.revisions

**Service Key:** `delete.all.content.revisions`

**Description:** Deletes Content Revision records for a content item.

**SQL:**

```sql
DELETE FROM app_fd_content_revision
WHERE c_content_id = ?
```

## App: Delete all Post Revisions

### Module: content-management

#### delete.all.post.revisions

**Service Key:** `delete.all.post.revisions`

**Description:** Deletes Post Revision records for a post.

**SQL:**

```sql
DELETE FROM app_fd_post_revision
WHERE c_post_id = ?
```

## App: Delete old content Revisions

### Module: content-management

#### delete.old.content.revisions

**Service Key:** `delete.old.content.revisions`

**Description:** Deletes Content Revision records older than 7 days.

**SQL:**

```sql
DELETE FROM app_fd_content_revision
WHERE datecreated < NOW() - INTERVAL '7 days'
AND c_content_id = ?;
```

## App: Delete Old Post Revisions

### Module: content-management

#### delete.old.post.revisions

**Service Key:** `delete.old.post.revisions`

**Description:** Deletes Post Revision records older than 7 days.

**SQL:**

```sql
DELETE FROM app_fd_post_revision
WHERE datecreated < NOW() - INTERVAL '7 days'
AND c_post_id = ?;
```

## App: dms

### Module: content-management

#### dms.doc.checkin.status

**Service Key:** `dms.doc.checkin.status`

**Description:** Retrieves Dms Document, Directory User records.

**SQL:**

```sql
SELECT dd.c_status, du.firstname,du.lastname
FROM app_fd_dms_document AS dd
LEFT JOIN dir_user AS du
    ON dd.c_checked_out_by = du.username
WHERE dd.id = ?
```

#### dms.folder.child.doc.type

**Service Key:** `dms.folder.child.doc.type`

**Description:** Retrieves Dms Folder Type, Dms Folder Doc Type, Dms Doc Type, Process Map, App Form records grouped in SQL.

**SQL:**

```sql
select
id, c_name, json_agg(obj_doc) AS c_doc_form_key
FROM(
    SELECT pt.id, pt.c_name, 
json_build_object( 'id', dt.id, 'on_create', odc.c_process_key,
           'form_key', d.c_form_key, 'title', dt.c_name, 'type','doc', 'mandatory', fdt.c_mandatory
         ) AS obj_doc
from app_fd_dms_folder_type pt
LEFT JOIN app_fd_dms_folder_doc_type fdt ON
fdt.c_folder_type = pt.id
LEFT JOIN app_fd_dms_doc_type dt ON
dt.id = fdt.c_doc_type
	left Join app_fd_process_map as odc on odc.id = dt.c_on_create
	LEFT JOIN app_fd_app_form as d on d.id = dt.c_form_id 
	) TEMP
	where obj_doc->>'id' is not null and id = ?
	group by id, c_name
```

#### dms.folder.child.folder.type

**Service Key:** `dms.folder.child.folder.type`

**Description:** Retrieves Dms Folder Type, Dms Folder Folder Type, App Form records grouped in SQL.

**SQL:**

```sql
select
id, c_name,
json_agg(obj_folder) AS c_folder_form_key
FROM(
    SELECT pt.id, pt.c_name, json_build_object( 'id', ft.id,
           'form_key', ff.c_form_key, 'title', ft.c_name, 'type','folder' 
         ) AS obj_folder 
from app_fd_dms_folder_type pt 
		LEFT JOIN app_fd_dms_folder_folder_type fft ON
fft.c_parent_type = pt.id
			LEFT JOIN app_fd_dms_folder_type ft ON
ft.id = fft.c_child_type  
  LEFT JOIN app_fd_app_form as ff on ff.id = ft.c_form_id 	
	) TEMP
	where obj_folder->>'id' is not null and id = ?
	group by id, c_name
```

#### dms.folder.child.type

**Service Key:** `dms.folder.child.type`

**Description:** Retrieves Dms Folder Type, Dms Folder Folder Type, App Form, Dms Folder Doc Type, Dms Doc Type, Process Map records by ID, grouped in SQL.

**SQL:**

```sql
select
id, c_name, 
json_agg(obj_folder) AS c_folder_form_key , json_agg(obj_doc) AS c_doc_form_key

FROM(
    SELECT pt.id, pt.c_name, json_build_object( 'id', ft.id, 
           'form_key', ff.c_form_key, 'title', ft.c_name, 'type','folder'
         ) AS obj_folder , 
json_build_object( 'id', dt.id, 'on_create', odc.c_process_key,
           'form_key', d.c_form_key, 'title', dt.c_name, 'type','doc' , 'mandatory', fdt.c_mandatory
         ) AS obj_doc
from app_fd_dms_folder_type pt 
		LEFT JOIN app_fd_dms_folder_folder_type fft ON
fft.c_parent_type = pt.id
			LEFT JOIN app_fd_dms_folder_type ft ON
ft.id = fft.c_child_type
  LEFT JOIN app_fd_app_form as ff on ff.id = ft.c_form_id 
	
	LEFT JOIN app_fd_dms_folder_doc_type fdt ON
fdt.c_folder_type = pt.id
LEFT JOIN app_fd_dms_doc_type dt ON
dt.id = fdt.c_doc_type
	left Join app_fd_process_map as odc on odc.id = dt.c_on_create
	LEFT JOIN app_fd_app_form as d on d.id = dt.c_doc_form_id 
	) TEMP
	where id = ?
	group by id, c_name
```

#### dms.get.archived.doc

**Service Key:** `dms.get.archived.doc`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Doc Revision, Dms Document, Directory User, Dms Doc Permission, Directory User Group, Dms Doc Type, Process Map, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
SELECT 
dd.*, dt.c_name as doc_type_name, af.c_table, af.c_form_key, du.firstname, du.lastname,
(select count(id) from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=dd.id) as c_like_count,
coalesce(onupdate.c_process_key, '') as on_update, coalesce(ondelete.c_process_key, '') as on_delete,
coalesce(oncheckin.c_process_key, '') as on_checkin,
(select count(id) current_revision from app_fd_dms_doc_revision where c_doc_id=dd.id
group by c_doc_id) as c_current_revision, d.c_permission
FROM (select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_document d
left join app_fd_dms_doc_permission p on p.c_doc_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_repository_id = ? and d.c_status='ARCHIVE'
group by d.id) as d
join app_fd_dms_document AS dd on dd.id=d.id
  Join app_fd_dms_doc_type As dt
   On dt.id = dd.c_doc_type
    left Join app_fd_process_map as onupdate on onupdate.id = dt.c_on_update
  left Join app_fd_process_map as ondelete on ondelete.id = dt.c_on_delete
  left Join app_fd_process_map as oncheckin on oncheckin.id = dt.c_on_checkin 
JOIN app_fd_app_form AS af
    ON
af.id = dt.c_form_id
LEFT JOIN dir_user AS du
    ON
dd.c_checked_out_by = du.username
```

#### dms.get.archived.folder

**Service Key:** `dms.get.archived.folder`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Folder, Directory User, Dms Folder Permission, Directory User Group, Dms Folder Type, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
select ft.c_name as c_folder_type_name,
(select count(id) from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=folder.id) as c_like_count,
folder.*,  af.c_table, af.c_form_key, fp.c_permission
from (select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_folder d
left join app_fd_dms_folder_permission p on p.c_folder_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_status = 'ARCHIVE' and d.c_repository_id=?
group by d.id) as fp
  JOIN app_fd_dms_folder as folder on folder.id = fp.id
  JOIN app_fd_dms_folder_type ft on ft.id=folder.c_folder_type
  JOIN app_fd_app_form as af on af.id = ft.c_form_id
```

#### dms.get.current.user.checkout.doc

**Service Key:** `dms.get.current.user.checkout.doc`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Doc Revision, Dms Document, Dms Doc Type, Process Map, App Form, Directory User records with an aggregate count, grouped in SQL.

**SQL:**

```sql
SELECT 
dd.*, dt.c_name as doc_type_name, af.c_table, af.c_form_key, du.firstname, du.lastname,
(select count(id) from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=dd.id) as c_like_count,
coalesce(onupdate.c_process_key, '') as on_update, coalesce(ondelete.c_process_key, '') as on_delete,
coalesce(oncheckin.c_process_key, '') as on_checkin,
(select count(id) current_revision from app_fd_dms_doc_revision where c_doc_id=dd.id
group by c_doc_id) as c_current_revision
FROM app_fd_dms_document AS dd
  Join app_fd_dms_doc_type As dt
  On dt.id = dd.c_doc_type
    left Join app_fd_process_map as onupdate on onupdate.id = dt.c_on_update
  left Join app_fd_process_map as ondelete on ondelete.id = dt.c_on_delete  
   left Join app_fd_process_map as oncheckin on oncheckin.id = dt.c_on_checkin
JOIN app_fd_app_form AS af ON af.id = dt.c_form_id
LEFT JOIN dir_user AS du ON dd.c_checked_out_by = du.username
where dd.c_status = 'CHECKED_OUT' and dd.c_checked_out_by = '#currentUser.username#' and dd.c_repository_id=? 
```

#### dms.get.datalist

**Service Key:** `dms.get.datalist`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
SELECT d.id, d.c_form_id, c_db_column
FROM app_fd_app_datalist AS d
WHERE d.c_db_column = ?;
```

#### dms.get.docs

**Service Key:** `dms.get.docs`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Doc Revision, Dms Document, Directory User, Dms Doc Permission, Directory User Group, Dms Doc Type, Process Map, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
SELECT 
dd.*,  dt.c_name as doc_type_name, af.c_table, af.c_form_key, du.firstname, du.lastname,
(select count(id) from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=dd.id) as c_like_count,
coalesce(onupdate.c_process_key, '') as on_update, coalesce(ondelete.c_process_key, '') as on_delete,
coalesce(oncheckin.c_process_key, '') as on_checkin,
(select count(id) current_revision from app_fd_dms_doc_revision where c_doc_id=dd.id
group by c_doc_id) as c_current_revision, d.c_permission
FROM 
(select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_document d
left join app_fd_dms_doc_permission p on p.c_doc_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_parent_id = ? and (d.c_status is null or d.c_status='' or d.c_status='CHECKED_OUT')
group by d.id) as d
join app_fd_dms_document AS dd on dd.id=d.id
  Join app_fd_dms_doc_type As dt
    left Join app_fd_process_map as onupdate on onupdate.id = dt.c_on_update
  left Join app_fd_process_map as ondelete on ondelete.id = dt.c_on_delete
  left Join app_fd_process_map as oncheckin on oncheckin.id = dt.c_on_checkin
  On dt.id = dd.c_doc_type
JOIN app_fd_app_form AS af
    ON
af.id = dt.c_form_id
LEFT JOIN dir_user AS du
    ON
dd.c_checked_out_by = du.username
```

#### dms.get.folders

**Service Key:** `dms.get.folders`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Folder, Directory User, Dms Folder Permission, Directory User Group, Dms Folder Type, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
select ft.c_name as c_folder_type_name,
(select count(id) from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=folder.id) as c_like_count,
folder.*, af.c_table, af.c_form_key, fp.c_permission
from (select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_folder d
left join app_fd_dms_folder_permission p on p.c_folder_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_parent_id = ? and 
		(d.c_status is null or d.c_status<>'ARCHIVE')
group by d.id) as fp
  JOIN app_fd_dms_folder as folder on folder.id = fp.id
  JOIN app_fd_dms_folder_type ft on ft.id=folder.c_folder_type
  JOIN app_fd_app_form as af on af.id = ft.c_form_id 
```

#### dms.get.repository

**Service Key:** `dms.get.repository`

**Description:** Retrieves Dms Repository records by ID.

**SQL:**

```sql
SELECT id, c_name, 'repository' as c_folder_type
  from app_fd_dms_repository
  WHERE id =?
```

#### dms.repo.child.doc.type

**Service Key:** `dms.repo.child.doc.type`

**Description:** Retrieves Dms Repository, Dms Repo Doc Type, Dms Doc Type, Process Map, App Form records grouped in SQL.

**SQL:**

```sql
SELECT id, c_name, json_agg(obj_doc) AS c_doc_form_key
FROM (SELECT r.id, r.c_name, json_build_object( 'id', dt.id, 'on_create', odc.c_process_key,
           'form_key', d.c_form_key, 'title', dt.c_name,  'type','doc', 'mandatory', rdt.c_mandatory
         ) AS obj_doc
FROM app_fd_dms_repository r
LEFT JOIN app_fd_dms_repo_doc_type rdt ON
rdt.c_repository_id = r.id
LEFT JOIN app_fd_dms_doc_type dt ON
dt.id = rdt.c_doc_type
	  left Join app_fd_process_map as odc on odc.id = dt.c_on_create
JOIN app_fd_app_form d ON
d.id = dt.c_form_id) TEMP
where obj_doc->>'id' is not null and id=?
GROUP BY id, c_name;
```

#### dms.repo.child.folder.type

**Service Key:** `dms.repo.child.folder.type`

**Description:** Retrieves Dms Repository, Dms Repo Folder Type, Dms Folder Type, App Form records by ID, grouped in SQL.

**SQL:**

```sql
SELECT id, c_name, json_agg(obj_folder) AS c_folder_form_key
FROM (SELECT r.id, r.c_name, json_build_object( 'id', ft.id,
           'form_key', f.c_form_key, 'title', ft.c_name,  'type','folder'
         ) AS obj_folder
FROM app_fd_dms_repository r
LEFT JOIN app_fd_dms_repo_folder_type rft ON
rft.c_repository_id = r.id
LEFT JOIN app_fd_dms_folder_type ft ON
ft.id = rft.c_folder_type
JOIN app_fd_app_form f ON
f.id = ft.c_form_id) TEMP
where id=?
GROUP BY id, c_name;
```

#### dms.repo.child.type

**Service Key:** `dms.repo.child.type`

**Description:** Retrieves Dms Repository, Dms Repo Folder Type, Dms Folder Type, App Form, Dms Repo Doc Type, Dms Doc Type records by ID, grouped in SQL.

**SQL:**

```sql
SELECT id, c_name, json_agg(obj_folder) AS c_folder_form_key, json_agg(obj_doc) AS c_doc_form_key
FROM(
    SELECT r.id, r.c_name, json_build_object( 'id', ft.id,
           'form_key', f.c_form_key, 'title', ft.c_name,  'type','folder'
         ) AS obj_folder, json_build_object(
           'form_key', d.c_form_key, 'title', dt.c_name,  'type','doc', 'mandatory', rdt.c_mandatory
         ) AS obj_doc
FROM app_fd_dms_repository r
LEFT JOIN app_fd_dms_repo_folder_type rft ON
rft.c_repository_id = r.id
LEFT JOIN app_fd_dms_folder_type ft ON
ft.id = rft.c_folder_type
LEFT JOIN app_fd_app_form f ON
f.id = ft.c_form_id
LEFT JOIN app_fd_dms_repo_doc_type rdt ON
rdt.c_repository_id = r.id
LEFT JOIN app_fd_dms_doc_type dt ON
dt.id = rdt.c_doc_type
LEFT JOIN app_fd_app_form d ON
d.id = dt.c_form_id
	  ) TEMP
WHERE id =?
GROUP BY id, c_name;
```

#### dms.repo.documents

**Service Key:** `dms.repo.documents`

**Description:** Retrieves Dms Document, Dms Doc Type, App Form records.

**SQL:**

```sql
select dd.*,af.c_table
from app_fd_dms_document as dd
JOIN app_fd_dms_doc_type dt on dt.id=dd.c_doc_type
JOIN app_fd_app_form as af
on af.id = dt.c_form_id
where c_repository_id = ?
```

#### dms.repo.folders

**Service Key:** `dms.repo.folders`

**Description:** Retrieves Dms Folder, Dms Folder Type, App Form records.

**SQL:**

```sql
select
folder.*, af.c_table, af.c_form_key
from app_fd_dms_folder as folder
  JOIN app_fd_dms_folder_type ft on ft.id=folder.c_folder_type
  JOIN app_fd_app_form as af on af.id = ft.c_form_id 
where folder.c_repository_id = ? 
```

### Module: unknows

#### dms.doc.revision

**Service Key:** `dms.doc.revision`

**Description:** Retrieves Dms Doc Revision records with an aggregate count, grouped in SQL.

**SQL:**

```sql
select c_doc_id, count(id)+1 current_revision
from app_fd_dms_doc_revision
where c_doc_id=?
group by c_doc_id
```

#### dms.doc.type

**Service Key:** `dms.doc.type`

**Description:** Retrieves Dms Doc Type records.

**SQL:**

```sql
select id, c_name from app_fd_dms_doc_type
```

#### dms.folder.type

**Service Key:** `dms.folder.type`

**Description:** Retrieves Dms Folder Type records.

**SQL:**

```sql
select id, c_name from app_fd_dms_folder_type
```

#### dms.form.list

**Service Key:** `dms.form.list`

**Description:** Retrieves App Form records.

**SQL:**

```sql
select id, c_name from app_fd_app_form
```

#### dms.get.favorite.docs

**Service Key:** `dms.get.favorite.docs`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Doc Revision, Dms Document, Directory User, Dms Doc Permission, Directory User Group, Dms Doc Type, Process Map, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
SELECT 
dd.*, dt.c_name as doc_type_name, af.c_table, af.c_form_key, du.firstname, du.lastname,
(select count(id) from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=dd.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=dd.id) as c_like_count,
coalesce(onupdate.c_process_key, '') as on_update, coalesce(ondelete.c_process_key, '') as on_delete,
coalesce(oncheckin.c_process_key, '') as on_checkin,
(select count(id) current_revision from app_fd_dms_doc_revision where c_doc_id=dd.id
group by c_doc_id) as c_current_revision, d.c_permission
FROM (select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_document d
left join app_fd_dms_doc_permission p on p.c_doc_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_repository_id = ? and (d.c_status is null or d.c_status='' or d.c_status='ARCHIVE')
group by d.id) as d
join app_fd_dms_document AS dd on dd.id=d.id
join app_fd_dms_favorite df on dd.id=df.c_obj_id
  Join app_fd_dms_doc_type As dt
   On dt.id = dd.c_doc_type
    left Join app_fd_process_map as onupdate on onupdate.id = dt.c_on_update
  left Join app_fd_process_map as ondelete on ondelete.id = dt.c_on_delete
  left Join app_fd_process_map as oncheckin on oncheckin.id = dt.c_on_checkin 
JOIN app_fd_app_form AS af
    ON
af.id = dt.c_form_id
LEFT JOIN dir_user AS du
    ON
dd.c_checked_out_by = du.username
where df.c_reaction='FAVORITE' and c_username = '#currentUser.username#'
```

#### dms.get.favorite.folders

**Service Key:** `dms.get.favorite.folders`

**Description:** Retrieves Dms Favorite, Dms Like, Dms Folder, Directory User, Dms Folder Permission, Directory User Group, Dms Folder Type, App Form records with an aggregate count, grouped in SQL.

**SQL:**

```sql
select (select count(id) from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#') as c_favorite_count,
(select id from app_fd_dms_favorite where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_favorite_id,
(select id from app_fd_dms_like where c_obj_id=folder.id and c_username = '#currentUser.username#' limit 1) as c_like_id,
(select count(id) from app_fd_dms_like where c_obj_id=folder.id) as c_like_count,
folder.*, af.c_table, af.c_form_key, fp.c_permission
from 
(select d.id, coalesce(max(p.c_permission::int),'0') as c_permission from app_fd_dms_folder d
left join app_fd_dms_folder_permission p on p.c_folder_id=d.id
left join dir_user_group g on g.id like '%'||p.c_group||'%' and 
g.userid = (select id from dir_user where username='#currentUser.username#')
where d.c_repository_id=? and (d.c_status is NULL OR d.c_status = '' OR d.c_status <> 'ARCHIVE')
group by d.id) as fp
  JOIN app_fd_dms_folder as folder on folder.id = fp.id
  JOIN app_fd_dms_favorite f on folder.id = f.c_obj_id
  JOIN app_fd_dms_folder_type ft on ft.id=folder.c_folder_type
  JOIN app_fd_app_form as af on af.id = ft.c_form_id 
where f.c_reaction='FAVORITE' and f.c_username = '#currentUser.username#'
```

#### dms.repo.list

**Service Key:** `dms.repo.list`

**Description:** Retrieves Dms Repository records.

**SQL:**

```sql
select id, c_name from app_fd_dms_repository
```

#### list.process

**Service Key:** `list.process`

**Description:** Retrieves Process Map records.

**SQL:**

```sql
select id, c_title from app_fd_process_map
```

## App: DMS

### Module: content-management

#### dms.list.repository

**Service Key:** `dms.list.repository`

**Description:** Retrieves Dms Repository records.

**SQL:**

```sql
select * from app_fd_dms_repository
```

## App: dms capture electron

### Module: unknows

#### dms.list.capture

**Service Key:** `dms.list.capture`

**Description:** Retrieves Dms Capture records.

**SQL:**

```sql
select c_title,id from app_fd_dms_capture
```

#### dms.list.capture.detail

**Service Key:** `dms.list.capture.detail`

**Description:** Retrieves Dms Capture Detail, Dms Folder, Process, Dms Doc Type, Dms Repository records.

**SQL:**

```sql
select dr.c_name as repository_name,ddt.c_name as c_doc_type_name,df.c_name as c_target_folder_name,
p.c_process_def_key as c_process_key, dcd.id, dcd.c_doc_type,
dcd.c_capture_id, dcd.c_target_folder,dcd.c_repository_id,dcd.c_watch_folder,dcd.c_process
from app_fd_dms_capture_detail as dcd
left join app_fd_dms_folder as df
on dcd.c_target_folder = df.id
left join app_fd_process as p
on dcd.c_process = p.id
left join app_fd_dms_doc_type ddt
on dcd.c_doc_type = ddt.id
join app_fd_dms_repository as dr
on dr.id = dcd.c_repository_id
where c_capture_id = ?
```

## App: framework

### Module: camunda

#### bpm.process.engine

**Service Key:** `bpm.process.engine`

**Description:** Retrieves Process Engine records.

**SQL:**

```sql
SELECT * FROM app_fd_process_engine;
```

#### sys.get.form

**Service Key:** `sys.get.form`

**Description:** Retrieves App Form records.

**SQL:**

```sql
SELECT * FROM app_fd_app_form
WHERE c_form_key = ?
```

#### sys.process.all

**Service Key:** `sys.process.all`

**Description:** Retrieves Process Map, Process, App Form, Directory User, Directory User Group, Directory Group records.

**SQL:**

```sql
SELECT distinct pm.id, pm.c_process_key, pm.c_title AS process_title, pm.c_subtitle as sub_title, pm.c_description,  pm.c_category,   pm.c_business_area, pm.c_urgency_levels,
pm.c_form_id, af.c_form_key , af.c_name AS form_name, af.c_table , p.c_process_id,
pm.c_hide_inbox_start, pm.c_allow_draft
FROM app_fd_process_map AS pm
join app_fd_process p on p.c_process_def_key=pm.c_process_key
JOIN app_fd_app_form AS af ON
af.id::text = pm.c_form_id::text
join dir_user u on u.username='#currentUser.username#'
JOIN dir_user_group ug on ug.userid::text=u.id::text
JOIN dir_group g on g.id::text=ug.groupid::text
WHERE pm.c_is_active = 'YES' 
and pm.c_channel like '%' || '#CHANNEL_ID#'|| '%' 
and pm.c_group like '%' || g.id || '%'
```

#### sys.start.process

**Service Key:** `sys.start.process`

**Description:** Retrieves Process Map, App Form records.

**SQL:**

```sql
SELECT pm.id, pm.c_title, pm.c_process_key, af.c_form_key, af.c_name AS form_name, 
  coalesce(pm.c_allow_draft,'NO') c_allow_draft, coalesce(pm.c_submit_label,'Start') c_submit_label
FROM app_fd_process_map AS pm
JOIN app_fd_app_form af ON 
pm.c_form_id::uuid = af.id::uuid
WHERE pm.c_is_active = 'YES'
AND pm.id = ?
```

#### sys.user.profile

**Service Key:** `sys.user.profile`

**Description:** Retrieves Directory Employment, Tenant Subscription, Directory User Replacement, Directory User, Directory User Role records grouped in SQL.

**SQL:**

```sql
SELECT (select o.organizationid from dir_employment o where o.userid=d.id limit 1) as organizationid, d.username, d.firstname, d.lastname, d.email, d.username as user_login, r.roleid,
COALESCE (d.provider,'system') AS provider, 
d.profile_img, d.mfa_type, d.phone, d.address, 
d.location, d.city, d.country, COALESCE (d.id,'') AS id,
'934f6f39-aef3-4e39-8a06-8425527237d2' as c_operator_id, 
(select c_subscription from app_fd_tenant_subscription) as subscription,
coalesce((select string_agg(''''||username||'''', ', ') from dir_user_replacement
where replacementuser=d.username
group by replacementuser), '') as delegates
FROM dir_user d 
join dir_user_role r on r.userid=d.id
where d.username = '#currentUser.username#'
```

### Module: content-management

#### list.guest.user

**Service Key:** `list.guest.user`

**Description:** Retrieves Directory User, Directory User Group, Directory Group records.

**SQL:**

```sql
SELECT u.username, g.code FROM dir_user AS u
JOIN dir_user_group AS ug ON ug.userid = u.id
JOIN dir_group AS g ON g.id = ug.groupid 
WHERE g.code = 'GUEST'
```

#### sys.app.builder.links

**Service Key:** `sys.app.builder.links`

**Description:** Retrieves App Link records.

**SQL:**

```sql
select * from app_fd_app_link
```

#### sys.app.link

**Service Key:** `sys.app.link`

**Description:** Retrieves App Link records ordered in SQL.

**SQL:**

```sql
SELECT id, c_name, c_type, c_channel_id
FROM app_fd_app_link f
where c_module = ?
order by f.c_module, f.c_position;
```

#### sys.app.menu

**Service Key:** `sys.app.menu`

**Description:** Retrieves App Menu records for a channel, ordered in SQL.

**SQL:**

```sql
select id, c_name, c_location, c_type, c_access, c_icon, c_channel_id
from app_fd_app_menu 
where c_channel_id = ?
order by c_position
```

#### sys.channel.link

**Service Key:** `sys.channel.link`

**Description:** Retrieves App Link records for a channel, ordered in SQL.

**SQL:**

```sql
select * from app_fd_app_link 
where c_channel_id = ?  
order by c_position
```

#### sys.console.dir.group

**Service Key:** `sys.console.dir.group`

**Description:** Retrieves Directory Group records.

**SQL:**

```sql
select * from dir_group
```

#### sys.console.dir.orgs

**Service Key:** `sys.console.dir.orgs`

**Description:** Retrieves Directory Organization records.

**SQL:**

```sql
select * from dir_organization
```

#### sys.content

**Service Key:** `sys.content`

**Description:** Retrieves App Content records by ID.

**SQL:**

```sql
SELECT *,  c_published as c_layout FROM app_fd_app_content WHERE id = ?
```

#### sys.content.page

**Service Key:** `sys.content.page`

**Description:** Retrieves App Content records.

**SQL:**

```sql
SELECT c.*
FROM app_fd_app_content c
WHERE c.id = ?
```

#### sys.content.pages

**Service Key:** `sys.content.pages`

**Description:** Retrieves App Content records.

**SQL:**

```sql
select id, c_name, c_status, c_tags, modifiedby, datemodified, c_channel, c_type
from app_fd_app_content
where c_channel = ?;
```

#### sys.dashboard

**Service Key:** `sys.dashboard`

**Description:** Retrieves Dashboards records by ID.

**SQL:**

```sql
select * from app_fd_dashboards where id = ?
```

#### sys.dashboards

**Service Key:** `sys.dashboards`

**Description:** Retrieves Dashboards records.

**SQL:**

```sql
select * from app_fd_dashboards
```

#### sys.datalist.viewer.list

**Service Key:** `sys.datalist.viewer.list`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id, c_name, c_db_column, c_form_id from app_fd_app_datalist
```

#### sys.dir.selected.organization

**Service Key:** `sys.dir.selected.organization`

**Description:** Retrieves Directory Organization records by ID.

**SQL:**

```sql
select *
from dir_organization
where id = ?
```

#### sys.domain.site

**Service Key:** `sys.domain.site`

**Description:** Retrieves App Site records.

**SQL:**

```sql
SELECT c.id, c.c_site_preference, 'guest' as c_user, c.c_allow_google_analytics, c.c_google_mid,
'false' as sub_allow_guest, 'false' as sub_allow_signup, c_home_page, c_landing_page
FROM app_fd_app_site c
WHERE c.c_domain = '#HOST_NAME#'
and c.c_subscription=?;
```

#### sys.entity.list

**Service Key:** `sys.entity.list`

**Description:** Retrieves Directory Organization records.

**SQL:**

```sql
select id, name from dir_organization
```

#### sys.form

**Service Key:** `sys.form`

**Description:** Retrieves App Form records by ID.

**SQL:**

```sql
select * from app_fd_app_form where id = ?
```

#### sys.form.formkey

**Service Key:** `sys.form.formkey`

**Description:** Retrieves App Form records.

**SQL:**

```sql
select * from app_fd_app_form where c_form_key = ?
```

#### sys.forms

**Service Key:** `sys.forms`

**Description:** Retrieves App Form records ordered in SQL.

**SQL:**

```sql
select id, c_name, c_table, c_form_key
from app_fd_app_form
order by c_name desc;
```

#### sys.get.form

**Service Key:** `sys.get.form`

**Description:** Retrieves App Form records.

**SQL:**

```sql
SELECT * FROM app_fd_app_form
WHERE c_form_key = ?
```

#### sys.get.link.by.module.id

**Service Key:** `sys.get.link.by.module.id`

**Description:** Retrieves App Link records.

**SQL:**

```sql
select id, c_name, c_module
from app_fd_app_link
where c_module = ?
```

#### sys.instance

**Service Key:** `sys.instance`

**Description:** Retrieves Instance records.

**SQL:**

```sql
select id, c_name, c_code, c_driver,c_url,c_user
from app_fd_instance;
```

#### sys.list.content

**Service Key:** `sys.list.content`

**Description:** Retrieves App Content records.

**SQL:**

```sql
SELECT c.id, c.c_name, c.c_description , c.c_tags  FROM app_fd_app_content c
where c.c_channel = ?
```

#### sys.menu.list

**Service Key:** `sys.menu.list`

**Description:** Retrieves App Menu records.

**SQL:**

```sql
select * from app_fd_app_menu
```

#### sys.pages

**Service Key:** `sys.pages`

**Description:** Retrieves Pages records.

**SQL:**

```sql
select distinct id, c_name, datemodified, modifiedby, c_channel, c_tags, c_type
from app_fd_pages
where c_channel = ?;
```

#### sys.pages.links

**Service Key:** `sys.pages.links`

**Description:** Retrieves Pages records.

**SQL:**

```sql
select p.id, p.c_name, p.c_type from app_fd_pages p
where p.c_channel = ?
```

#### sys.post

**Service Key:** `sys.post`

**Description:** Retrieves Post, Styles records.

**SQL:**

```sql
SELECT p.id, p.c_title, p.c_tags, p.c_styles, p.c_staging, p.c_published,
p.c_meta_tags, s.c_css_styles, c_status, p.c_channel_id, p.c_slug, p.c_type
FROM app_fd_post p
left JOIN app_fd_styles s on s.id::text = p.c_styles::text
where p.id = ?
```

#### sys.posts

**Service Key:** `sys.posts`

**Description:** Retrieves Post records for a channel.

**SQL:**

```sql
SELECT id, c_title, datemodified, c_tags, c_styles, c_status, c_type FROM app_fd_post where c_channel_id = ?
```

#### sys.public.link

**Service Key:** `sys.public.link`

**Description:** Retrieves App Menu, App Link records ordered in SQL.

**SQL:**

```sql
select m.c_name as module, f.*, CAST(f.c_position as integer) as position, m.c_position as m_position, m.datemodified m_datemodified
from app_fd_app_menu m 
join app_fd_app_link f on f.c_module = m.id
where m.c_access='PUBLIC'  and m.c_channel_id=?
order by m_position, m.datemodified, position  asc
```

#### sys.report

**Service Key:** `sys.report`

**Description:** Retrieves Reports Configration, Reports records.

**SQL:**

```sql
SELECT rc.*, r.c_masterreportfile, c_subreportfile
FROM app_fd_reports_configration AS rc
JOIN app_fd_reports r ON
r.c_reportkey = rc.c_report_key
WHERE rc.id = ?
```

#### sys.reports.configrations

**Service Key:** `sys.reports.configrations`

**Description:** Retrieves Reports Configration records.

**SQL:**

```sql
SELECT id, c_report_key, c_name
FROM app_fd_reports_configration;
```

#### sys.selected.asset

**Service Key:** `sys.selected.asset`

**Description:** Retrieves Assets records by ID.

**SQL:**

```sql
select id, c_title, c_dimensions, c_image, c_channel_id, c_tags
from app_fd_assets
where id = ?;
```

#### sys.selected.content.page

**Service Key:** `sys.selected.content.page`

**Description:** Retrieves App Content records by ID.

**SQL:**

```sql
select id, c_name, c_status, modifiedby, datemodified, c_channel, c_published,
c_description, c_tags, c_meta_tags, c_stagging, c_layout, c_slug, c_type
from app_fd_app_content
where id = ?;
```

#### sys.selected.datalist

**Service Key:** `sys.selected.datalist`

**Description:** Retrieves App Datalist, App Form records.

**SQL:**

```sql
select d.*, f.c_useprefix from app_fd_app_datalist d 
left join app_fd_app_form f on f.id::text=d.c_form_id
where d.id=?
```

#### sys.selected.link

**Service Key:** `sys.selected.link`

**Description:** Retrieves App Link records by ID.

**SQL:**

```sql
select * from app_fd_app_link where id = ?;
```

#### sys.selected.menu

**Service Key:** `sys.selected.menu`

**Description:** Retrieves App Menu records by ID.

**SQL:**

```sql
select id, c_name, c_location, c_type, c_icon, c_access
from app_fd_app_menu
where id = ?;
```

#### sys.selected.page

**Service Key:** `sys.selected.page`

**Description:** Retrieves Pages records by ID.

**SQL:**

```sql
select * from app_fd_pages where id = ?;
```

#### sys.selected.site

**Service Key:** `sys.selected.site`

**Description:** Retrieves App Site records by ID.

**SQL:**

```sql
select * from app_fd_app_site where id = ?;
```

#### sys.site

**Service Key:** `sys.site`

**Description:** Retrieves App Site records.

**SQL:**

```sql
SELECT * FROM app_fd_app_site where c_subscription=?
```

#### sys.site.administration

**Service Key:** `sys.site.administration`

**Description:** Retrieves App Site, Associated Site records.

**SQL:**

```sql
select a.c_organization_id,s.id, s.c_brand_title, s.c_domain
from app_fd_app_site as s
left join app_fd_associated_site as a
on a.c_site_id = s.id
where s.c_subscription=?
```

#### sys.site.menu.list

**Service Key:** `sys.site.menu.list`

**Description:** Retrieves App Menu records for a channel.

**SQL:**

```sql
select * from app_fd_app_menu where c_channel_id=?
```

#### sys.site.subdomain

**Service Key:** `sys.site.subdomain`

**Description:** Retrieves App Site records.

**SQL:**

```sql
SELECT * FROM app_fd_app_site WHERE c_domain = ?;
```

#### sys.style

**Service Key:** `sys.style`

**Description:** Retrieves Styles records by ID.

**SQL:**

```sql
select * from app_fd_styles where id = ?
```

#### sys.styles

**Service Key:** `sys.styles`

**Description:** Retrieves Styles records for a channel.

**SQL:**

```sql
select * from app_fd_styles where c_channel_id = ?
```

#### sys.tag.suggestion.list

**Service Key:** `sys.tag.suggestion.list`

**Description:** Retrieves Tag Suggestion records.

**SQL:**

```sql
SELECT id, c_list, c_category FROM app_fd_tag_suggestion WHERE c_category LIKE '%' || ? || '%'
```

#### sys.tags

**Service Key:** `sys.tags`

**Description:** Retrieves Tag records.

**SQL:**

```sql
select * from app_fd_tag
```

#### sys.tenant.process

**Service Key:** `sys.tenant.process`

**Description:** Retrieves Process records.

**SQL:**

```sql
select * from app_fd_process;
```

#### sys.tenant.site

**Service Key:** `sys.tenant.site`

**Description:** Retrieves App Site records for a channel.

**SQL:**

```sql
select id, c_entity_id, c_channel_id from app_fd_app_site where c_channel_id = ?
```

#### sys.user.authorization

**Service Key:** `sys.user.authorization`

**Description:** Retrieves Authorization records for a channel.

**SQL:**

```sql
SELECT id, c_title, datemodified, modifiedby, c_module
FROM app_fd_authorization where c_channel_id = ?
```

### Module: data-analysis

#### sys.analytic.query

**Service Key:** `sys.analytic.query`

**Description:** Retrieves Analytic Query records.

**SQL:**

```sql
select id, c_title, c_index_id
from app_fd_analytic_query
```

#### sys.index

**Service Key:** `sys.index`

**Description:** Retrieves Index records.

**SQL:**

```sql
select * from app_fd_index
```

#### sys.instance

**Service Key:** `sys.instance`

**Description:** Retrieves Instance records.

**SQL:**

```sql
select id, c_name, c_code, c_driver,c_url,c_user
from app_fd_instance;
```

#### sys.report.details

**Service Key:** `sys.report.details`

**Description:** Retrieves Reports records by ID.

**SQL:**

```sql
SELECT id, c_name, c_app , c_reportkey, c_datasource, c_masterreportfile, c_subreportfile
FROM app_fd_reports
WHERE id = ?;
```

#### sys.reports

**Service Key:** `sys.reports`

**Description:** Retrieves Reports records.

**SQL:**

```sql
SELECT id, c_app, c_name, c_reportkey
FROM app_fd_reports;
```

#### sys.reports.configration

**Service Key:** `sys.reports.configration`

**Description:** Retrieves Reports Configration records by ID.

**SQL:**

```sql
SELECT id, c_filter_position, c_output_iframe, c_show_filters, c_show_links,
c_filters, c_report_key, c_name, c_links_position, c_filters_position,  c_serviceparams
FROM app_fd_reports_configration
WHERE id =?;
```

#### sys.reports.configrations

**Service Key:** `sys.reports.configrations`

**Description:** Retrieves Reports Configration records.

**SQL:**

```sql
SELECT id, c_report_key, c_name
FROM app_fd_reports_configration;
```

#### sys.selected.analytic.query

**Service Key:** `sys.selected.analytic.query`

**Description:** Retrieves Analytic Query records by ID.

**SQL:**

```sql
select * from app_fd_analytic_query where id = ?;
```

#### sys.selected.index

**Service Key:** `sys.selected.index`

**Description:** Retrieves Index records by ID.

**SQL:**

```sql
select id, c_title, c_name, c_description, c_data_source, c_data_source_name, c_config
from app_fd_index
where id = ?
```

#### sys.selected.index.queries

**Service Key:** `sys.selected.index.queries`

**Description:** Retrieves Analytic Query records.

**SQL:**

```sql
select * from app_fd_analytic_query where c_index_id = ?
```

### Module: data-management

#### schema.get.all.columns

**Service Key:** `schema.get.all.columns`

**Description:** Retrieves Information Schema Columns records.

**SQL:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = ?
```

#### schema.get.all.tables

**Service Key:** `schema.get.all.tables`

**Description:** Retrieves Information Schema Tables records ordered in SQL.

**SQL:**

```sql
select table_name 
from information_schema.tables
where table_schema = 'public'
order by table_name
```

#### schema.table.column

**Service Key:** `schema.table.column`

**Description:** Retrieves Column Default, Information Schema Columns, Information Schema Constraint Column Usage, Information Schema Table Constraints, To, LATERAL records.

**SQL:**

```sql
SELECT
    cols.column_name,
    cols.column_default,
    cons.constraint_type,
    -- Extract the prefix from column_default (if present, or return NULL if not)
    prefix_match.prefix,
    -- Extract the format from column_default (if present, or return NULL if not)
    format_match.format
FROM
    information_schema.columns cols
LEFT JOIN
    information_schema.constraint_column_usage ccu 
    ON cols.table_schema = ccu.table_schema
    AND cols.table_name = ccu.table_name
    AND cols.column_name = ccu.column_name
LEFT JOIN
    information_schema.table_constraints cons 
    ON ccu.constraint_schema = cons.constraint_schema
    AND ccu.constraint_name = cons.constraint_name
-- Lateral join to extract the prefix using regexp_matches
LEFT JOIN LATERAL (
    SELECT (regexp_matches(cols.column_default, '''(.*?)''::text'))[1] AS prefix
) prefix_match ON true
-- Lateral join to extract the format using regexp_matches
LEFT JOIN LATERAL (
    SELECT (regexp_matches(cols.column_default, '''fm(.*?)''::text'))[1] AS format
) format_match ON true
WHERE
    cols.table_schema = 'public'
    AND cols.table_name = ?;

```

#### sys.datalist.export

**Service Key:** `sys.datalist.export`

**Description:** Retrieves App Datalist records by ID.

**SQL:**

```sql
select * from app_fd_app_datalist where id = ?;
```

#### sys.datalist.forms

**Service Key:** `sys.datalist.forms`

**Description:** Retrieves App Form records.

**SQL:**

```sql
select id, c_name, c_form_key from app_fd_app_form;
```

#### sys.datalist.list

**Service Key:** `sys.datalist.list`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id, c_name,  c_type, c_form_id
from app_fd_app_datalist;
```

#### sys.datalist.viewer.list

**Service Key:** `sys.datalist.viewer.list`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id, c_name, c_db_column, c_form_id from app_fd_app_datalist
```

#### sys.email.profiles

**Service Key:** `sys.email.profiles`

**Description:** Retrieves Email Profile records.

**SQL:**

```sql
SELECT id, c_email, c_host, c_sslport FROM app_fd_email_profile;
```

#### sys.email.services

**Service Key:** `sys.email.services`

**Description:** Retrieves Email Service records.

**SQL:**

```sql
SELECT id, c_emailkey, c_title, c_profile, c_sql, c_template FROM app_fd_email_service;
```

#### sys.emailtemplate.profiles

**Service Key:** `sys.emailtemplate.profiles`

**Description:** Retrieves Email Profile records.

**SQL:**

```sql
select id, c_host, c_email from app_fd_email_profile;
```

#### sys.form

**Service Key:** `sys.form`

**Description:** Retrieves App Form records by ID.

**SQL:**

```sql
select * from app_fd_app_form where id = ?
```

#### sys.forms

**Service Key:** `sys.forms`

**Description:** Retrieves App Form records ordered in SQL.

**SQL:**

```sql
select id, c_name, c_table, c_form_key
from app_fd_app_form
order by c_name desc;
```

#### sys.get.all.columns

**Service Key:** `sys.get.all.columns`

**Description:** Retrieves Information Schema Columns records.

**SQL:**

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = ?
```

#### sys.get.all.tables

**Service Key:** `sys.get.all.tables`

**Description:** Retrieves Information Schema Tables records.

**SQL:**

```sql
select table_name 
from information_schema.tables
where table_schema = 'public' 
and table_name like 'app_fd_%'
```

#### sys.get.form

**Service Key:** `sys.get.form`

**Description:** Retrieves App Form records.

**SQL:**

```sql
SELECT * FROM app_fd_app_form
WHERE c_form_key = ?
```

#### sys.get.forms.keys

**Service Key:** `sys.get.forms.keys`

**Description:** Retrieves App Form records.

**SQL:**

```sql
SELECT id, c_form_key, c_name
FROM app_fd_app_form
```

#### sys.instance

**Service Key:** `sys.instance`

**Description:** Retrieves Instance records.

**SQL:**

```sql
select id, c_name, c_code, c_driver,c_url,c_user
from app_fd_instance;
```

#### sys.module.instances

**Service Key:** `sys.module.instances`

**Description:** Retrieves Instance records.

**SQL:**

```sql
select id, c_name, c_code from app_fd_instance;
```

#### sys.report.details

**Service Key:** `sys.report.details`

**Description:** Retrieves Reports records by ID.

**SQL:**

```sql
SELECT id, c_name, c_app , c_reportkey, c_datasource, c_masterreportfile, c_subreportfile
FROM app_fd_reports
WHERE id = ?;
```

#### sys.reports

**Service Key:** `sys.reports`

**Description:** Retrieves Reports records.

**SQL:**

```sql
SELECT id, c_app, c_name, c_reportkey
FROM app_fd_reports;
```

#### sys.reports.configration

**Service Key:** `sys.reports.configration`

**Description:** Retrieves Reports Configration records by ID.

**SQL:**

```sql
SELECT id, c_filter_position, c_output_iframe, c_show_filters, c_show_links,
c_filters, c_report_key, c_name, c_links_position, c_filters_position,  c_serviceparams
FROM app_fd_reports_configration
WHERE id =?;
```

#### sys.reports.configrations

**Service Key:** `sys.reports.configrations`

**Description:** Retrieves Reports Configration records.

**SQL:**

```sql
SELECT id, c_report_key, c_name
FROM app_fd_reports_configration;
```

#### sys.selected.emailprofile

**Service Key:** `sys.selected.emailprofile`

**Description:** Retrieves Email Profile records by ID.

**SQL:**

```sql
SELECT id, c_email, c_host, c_sslport, c_emailpassword
FROM app_fd_email_profile
where id = ?;
```

#### sys.selected.emailtemplate

**Service Key:** `sys.selected.emailtemplate`

**Description:** Retrieves Email Service records by ID.

**SQL:**

```sql
select id, c_sql, c_template, c_profile, c_emailkey, c_title
from app_fd_email_service
where id = ?;
```

#### sys.selected.form

**Service Key:** `sys.selected.form`

**Description:** Retrieves App Form records by ID.

**SQL:**

```sql
select * from app_fd_app_form where id = ?;
```

#### sys.selected.instance

**Service Key:** `sys.selected.instance`

**Description:** Retrieves Instance records by ID.

**SQL:**

```sql
select id, c_name, c_code, c_driver, c_url,
c_user, c_password, c_description
from app_fd_instance
where id = ?; 
```

#### sys.selectedcategory.process

**Service Key:** `sys.selectedcategory.process`

**Description:** Retrieves Process Map records.

**SQL:**

```sql
select * from app_fd_process_map where c_category = ?
```

#### sys.tag.suggestion.list

**Service Key:** `sys.tag.suggestion.list`

**Description:** Retrieves Tag Suggestion records.

**SQL:**

```sql
SELECT id, c_list, c_category FROM app_fd_tag_suggestion WHERE c_category LIKE '%' || ? || '%'
```

### Module: process-configuration

#### bpm.process.engine

**Service Key:** `bpm.process.engine`

**Description:** Retrieves Process Engine records.

**SQL:**

```sql
SELECT * FROM app_fd_process_engine;
```

#### sys.console.dir.group

**Service Key:** `sys.console.dir.group`

**Description:** Retrieves Directory Group records.

**SQL:**

```sql
select * from dir_group
```

#### sys.forms

**Service Key:** `sys.forms`

**Description:** Retrieves App Form records ordered in SQL.

**SQL:**

```sql
select id, c_name, c_table, c_form_key
from app_fd_app_form
order by c_name desc;
```

#### sys.list.forms

**Service Key:** `sys.list.forms`

**Description:** Retrieves App Form records ordered in SQL.

**SQL:**

```sql
SELECT id, c_name, c_form_key
FROM app_fd_app_form
ORDER BY datemodified DESC;
```

#### sys.process.cat

**Service Key:** `sys.process.cat`

**Description:** Retrieves Process Map, App Form, Process Category, Directory User, Directory User Group, Directory Group records.

**SQL:**

```sql
SELECT pm.id, pm.c_process_key, pm.c_title AS process_title, pm.c_category, 
pm.c_form_id, af.c_form_key , af.c_name AS form_name, af.c_table , 
pc.c_title AS category_title
FROM app_fd_process_map AS pm
JOIN app_fd_app_form AS af ON
af.id::text = pm.c_form_id
JOIN app_fd_process_category AS pc ON
pc.c_key = pm.c_category
join dir_user u on u.username='#currentUser.username#'
JOIN dir_user_group ug on ug.userid::text=u.id::text
JOIN dir_group g on g.id::text=ug.groupid::text
WHERE 
pc.c_key=? and
pm.c_is_active = 'YES' and
pm.c_channel like '%' || '#CHANNEL_ID#'|| '%' 
and pm.c_group like '%' || g.id|| '%'
```

#### sys.site.administration

**Service Key:** `sys.site.administration`

**Description:** Retrieves App Site, Associated Site records.

**SQL:**

```sql
select a.c_organization_id,s.id, s.c_brand_title, s.c_domain
from app_fd_app_site as s
left join app_fd_associated_site as a
on a.c_site_id = s.id
where s.c_subscription=?
```

#### sys.tenant.process

**Service Key:** `sys.tenant.process`

**Description:** Retrieves Process records.

**SQL:**

```sql
select * from app_fd_process;
```

#### sys.user.list

**Service Key:** `sys.user.list`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
select id, username, firstname, lastname, email from dir_user
```

### Module: process-monitor

#### sys.console.dir.group

**Service Key:** `sys.console.dir.group`

**Description:** Retrieves Directory Group records.

**SQL:**

```sql
select * from dir_group
```

#### sys.user.list

**Service Key:** `sys.user.list`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
select id, username, firstname, lastname, email from dir_user
```

### Module: site-administrater

#### sys.site.administration

**Service Key:** `sys.site.administration`

**Description:** Retrieves App Site, Associated Site records.

**SQL:**

```sql
select a.c_organization_id,s.id, s.c_brand_title, s.c_domain
from app_fd_app_site as s
left join app_fd_associated_site as a
on a.c_site_id = s.id
where s.c_subscription=?
```

### Module: subscription

#### sys.active.users

**Service Key:** `sys.active.users`

**Description:** Retrieves Directory User records with an aggregate count.

**SQL:**

```sql
select count(id) as active_users from dir_user 
  where active = '1' and username not in ('admin','guest'); 
```

### Module: unknows

#### bpm.get.task

**Service Key:** `bpm.get.task`

**Description:** Retrieves Job, Process Instance, Process, Variable, Wf User Task records grouped in SQL.

**SQL:**

```sql
SELECT TO_CHAR(TO_TIMESTAMP(i.start_ / 1000), 'YYYY-MM-DD HH24:MI:SS') as datecreated, j.key_ as id, 
coalesce(t.id, 'new') as assignee_id,
  coalesce(t.c_assignee, replace(convert_from(lo_get(a.value_::oid), 'UTF8'), '"',''),'') as assignee,
  coalesce(t.c_due_date,'') as due_date, coalesce(t.c_follow_up,'') as follow_up,
  p.c_title as process_name, j.process_instance_key_ as process_instance_id, 
i.bpmn_process_id_ as process_def_key, i.process_definition_key_ as process_id
     , jsonb_object_agg(v.name_, replace(convert_from(lo_get(v.value_::oid), 'UTF8'), '"','')) AS variables
FROM job j 
join process_instance i on i.key_=j.process_instance_key_
join app_fd_process p on p.c_process_def_key=i.bpmn_process_id_
left JOIN variable v ON v.process_instance_key_=j.process_instance_key_
or (v.scope_key_=j.element_instance_key_ or v.process_instance_key_=j.process_instance_key_)
left JOIN variable a ON a.scope_key_=j.element_instance_key_ and a.process_instance_key_=j.process_instance_key_
and a.name_='assignee'
left join app_fd_wf_user_task t on t.c_task_id::bigint=j.key_
where j.job_type_='io.camunda.zeebe:userTask' 
and j.state_ not in ('completed', 'canceled')
and j.key_=?
GROUP  BY a.value_, j.key_, i.key_, p.c_title, t.id, t.c_assignee, t.c_due_date, t.c_follow_up
```

#### bpm.list.all.task

**Service Key:** `bpm.list.all.task`

**Description:** Retrieves Wf User Task, Process Map records ordered in SQL.

**SQL:**

```sql
SELECT t.*, t.c_status, p.c_title AS c_process_name 
FROM app_fd_wf_user_task t 
JOIN app_fd_process_map p ON p.c_process_key = t.c_process_def_key 
WHERE t.c_status NOT IN ('3') 
ORDER BY datemodified DESC;

```

#### bpm.list.my.task

**Service Key:** `bpm.list.my.task`

**Description:** Retrieves Wf User Task records ordered in SQL.

**SQL:**

```sql
select * from app_fd_wf_user_task 
where c_assignee = '#currentUser.username#' and c_status='1'
order by datemodified desc
```

#### bpm.list.my.task1

**Service Key:** `bpm.list.my.task1`

**Description:** Retrieves Job, Process Instance, Variable, Wf User Task records grouped in SQL, ordered in SQL.

**SQL:**

```sql
select distinct tasks.*, tasks. Variables->>'assignee' as assignee from 
(SELECT TO_CHAR(TO_TIMESTAMP(j.timestamp_ / 1000), 'YYYY-MM-DD HH24:MI:SS') as datecreated, j.key_ as id, j.element_instance_key_ as scope_key, coalesce(t.id,'new') as assignee_id, coalesce(t.c_assignee,'') as assignee,
  coalesce(t.c_due_date,'') as due_date, coalesce(t.c_follow_up,'') as follow_up,
  j.process_instance_key_ as process_instance_id, 
i.bpmn_process_id_ as process_def_key, i.process_definition_key_ as process_id
     , jsonb_object_agg(v.name_, replace(convert_from(lo_get(v.value_::oid), 'UTF8'), '"','') order by v.scope_key_) AS variables
FROM job j 
join process_instance i on i.key_=j.process_instance_key_
left JOIN variable v ON v.scope_key_=j.process_instance_key_
or (v.scope_key_=j.element_instance_key_ )
left join app_fd_wf_user_task t on t.c_task_id::bigint=j.key_
where j.job_type_='io.camunda.zeebe:userTask' and j.state_ not in ('completed', 'canceled') 
  and i.bpmn_process_id_ like '#HOST_DB#%'
GROUP  BY j.key_, i.key_, t.id, t.c_assignee, t.c_due_date, t.c_follow_up 
order by j.timestamp_ desc 
) as tasks
where 
  tasks.variables->>'assignee'='#currentUser.username#'
```

#### bpm8.list.all.task1

**Service Key:** `bpm8.list.all.task1`

**Description:** Retrieves Job, Process Instance, Variable, Wf User Task records grouped in SQL, ordered in SQL.

**SQL:**

```sql
select tasks.*, tasks.variables->>'assignee' as assignee from 
(SELECT TO_CHAR(TO_TIMESTAMP(j.timestamp_ / 1000), 'YYYY-MM-DD HH24:MI:SS') as datecreated, j.key_ as id, j.element_instance_key_ as scope_key, coalesce(t.id,'new') as assignee_id, coalesce(t.c_assignee,'') as assignee,
  coalesce(t.c_due_date,'') as due_date, coalesce(t.c_follow_up,'') as follow_up,
  j.process_instance_key_ as process_instance_id, 
i.bpmn_process_id_ as process_def_key, i.process_definition_key_ as process_id
     , jsonb_object_agg(v.name_, replace(convert_from(lo_get(v.value_::oid), 'UTF8'), '"','') order by v.scope_key_) AS variables
FROM job j 
join process_instance i on i.key_=j.process_instance_key_
left JOIN variable v ON (v.scope_key_=j.element_instance_key_ or v.scope_key_=j.process_instance_key_) 
left join app_fd_wf_user_task t on t.c_task_id::bigint=j.key_
where j.job_type_='io.camunda.zeebe:userTask' and j.state_ not in ('completed', 'canceled') 
  and i.bpmn_process_id_ like '#HOST_DB#%'
GROUP  BY j.key_, i.key_, t.id, t.c_assignee, t.c_due_date, t.c_follow_up
order by j.timestamp_ desc
) as tasks
```

#### check.guest.login

**Service Key:** `check.guest.login`

**Description:** Retrieves App Site records.

**SQL:**

```sql
select c_username from app_fd_app_site where c_domain='#HOST_NAME#' and c_guest_login='YES'
```

#### cloud.subscriptions

**Service Key:** `cloud.subscriptions`

**Description:** Retrieves Subscription records.

**SQL:**

```sql
select id, c_site_name from app_fd_subscription
```

#### guest.login

**Service Key:** `guest.login`

**Description:** Retrieves Directory User records by username.

**SQL:**

```sql
select username from dir_user where username=?
```

#### list.img.assets

**Service Key:** `list.img.assets`

**Description:** Retrieves Assets records for a channel, ordered in SQL.

**SQL:**

```sql
SELECT id, c_image, c_title
FROM app_fd_assets
WHERE c_channel_id = ?
ORDER BY datemodified DESC ;
```

#### schema.table.constraints

**Service Key:** `schema.table.constraints`

**Description:** Retrieves PostgreSQL Pg Constraint, PostgreSQL Pg Class records.

**SQL:**

```sql
SELECT conname AS constraint_name, 
contype AS constraint_type
FROM pg_catalog.pg_constraint cons
JOIN pg_catalog.pg_class t ON t.oid = cons.conrelid
WHERE t.relname = ? 
```

#### sys.app.builder.forms

**Service Key:** `sys.app.builder.forms`

**Description:** Retrieves App Form records.

**SQL:**

```sql
select id, c_name, c_form_key from app_fd_app_form
```

#### sys.app.reports

**Service Key:** `sys.app.reports`

**Description:** Retrieves Reports records.

**SQL:**

```sql
select * from app_fd_reports
```

#### sys.categories

**Service Key:** `sys.categories`

**Description:** Retrieves Categories records.

**SQL:**

```sql
select * from app_fd_categories
```

#### sys.content.list

**Service Key:** `sys.content.list`

**Description:** Retrieves App Content records.

**SQL:**

```sql
SELECT c.*
FROM app_fd_app_content c
```

#### sys.dim.commodity

**Service Key:** `sys.dim.commodity`

**Description:** Retrieves Commodity records.

**SQL:**

```sql
select * from dim_commodity
```

#### sys.dim.gender

**Service Key:** `sys.dim.gender`

**Description:** Retrieves Gender records.

**SQL:**

```sql
select * from dim_gender
```

#### sys.dim.roster

**Service Key:** `sys.dim.roster`

**Description:** Retrieves Roster records.

**SQL:**

```sql
select * from dim_roster
```

#### sys.filtered.link

**Service Key:** `sys.filtered.link`

**Description:** Retrieves App Link, App Menu records ordered in SQL.

**SQL:**

```sql
select f.id, f.c_name as feature, f.c_module as module_id, m.c_name as module, f.c_slug
from app_fd_app_link f
join app_fd_app_menu m on m.id = f.c_module
order by m.c_name, f.c_name 	
```

#### sys.get.page

**Service Key:** `sys.get.page`

**Description:** Retrieves App Link, Pages, Styles records.

**SQL:**

```sql
SELECT p.*, s.c_css_styles
FROM app_fd_app_link f 
JOIN app_fd_pages p ON
p.id::text = f.c_feature_key
left JOIN app_fd_styles s on s.id::text = p.c_styles
WHERE f.id = ?
```

#### sys.get.styles

**Service Key:** `sys.get.styles`

**Description:** Retrieves Styles records by ID.

**SQL:**

```sql
select c_css_styles from app_fd_styles
where id = ?

```

#### sys.get.user.role

**Service Key:** `sys.get.user.role`

**Description:** Retrieves Directory User, Directory User Role records.

**SQL:**

```sql
SELECT
du.id, du.username , dur.roleid
FROM dir_user AS du
JOIN dir_user_role dur
ON
du.id = dur.userid
WHERE du.username = '#currentUser.username#';
```

#### sys.link

**Service Key:** `sys.link`

**Description:** Retrieves Directory User, Directory User Group, Authorization, App Menu, App Link records ordered in SQL.

**SQL:**

```sql
select distinct f.*, CAST(f.c_position as integer) as position, m.c_position as m_position, m.datemodified m_datemodified
from dir_user u
join dir_user_group g on g.userid=u.id
join app_fd_authorization a on a.c_group like '%' || g.groupid || '%' 
join app_fd_app_menu m on m.c_channel_id=a.c_channel_id and a.c_module = m.id
join app_fd_app_link f on f.c_module=m.id and f.c_channel_id=a.c_channel_id and a.c_module_feature like '%' || f.id || '%'
where u.username='#currentUser.username#' and a.c_channel_id = ?
order by m_position, m.datemodified, position  asc
```

#### sys.link.list

**Service Key:** `sys.link.list`

**Description:** Retrieves App Link records ordered in SQL.

**SQL:**

```sql
SELECT f.* FROM app_fd_app_link f
order by f.c_module, f.c_position
```

#### sys.list.user.delegation

**Service Key:** `sys.list.user.delegation`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
select username as value, username as label from dir_user
```

#### sys.menu

**Service Key:** `sys.menu`

**Description:** Retrieves Directory User, Directory User Group, Authorization, App Menu records ordered in SQL.

**SQL:**

```sql
select distinct m.c_name, m.id, m.c_position, m.c_location, m.c_type, m.c_icon, m.datemodified, a.c_orgs 
from dir_user u join dir_user_group g on g.userid=u.id 
join app_fd_authorization a on a.c_group like '%' || g.groupid || '%'  
join app_fd_app_menu m on m.c_channel_id=a.c_channel_id and a.c_module = m.id 
where u.username='#currentUser.username#' and a.c_channel_id = ?
  and (a.c_orgs is null OR a.c_orgs='' 
        OR '#USER_ORG#' = ANY (
            string_to_array(a.c_orgs, ';')
        ))
order by m.c_position, m.datemodified
```

#### sys.pivot.table.data

**Service Key:** `sys.pivot.table.data`

**Description:** Retrieves Pivot Table records.

**SQL:**

```sql
select * from app_fd_pivot_table
```

#### sys.post.tags

**Service Key:** `sys.post.tags`

**Description:** Retrieves Tag records for a post.

**SQL:**

```sql
select * from app_fd_tag where c_post_id = ?
```

#### sys.public.content

**Service Key:** `sys.public.content`

**Description:** Retrieves App Content records by ID.

**SQL:**

```sql
SELECT *,  c_published as c_layout FROM app_fd_app_content WHERE id = ? and c_type='PUBLIC'
```

#### sys.public.menu

**Service Key:** `sys.public.menu`

**Description:** Retrieves App Menu records ordered in SQL.

**SQL:**

```sql
select m.c_name, m.id, m.c_position, 
m.c_location, m.c_type, m.c_icon, m.datemodified
from app_fd_app_menu m
where m.c_access='PUBLIC'  and c_channel_id=?
order by m.c_position
```

#### sys.public.page

**Service Key:** `sys.public.page`

**Description:** Retrieves App Link, Pages, Styles records.

**SQL:**

```sql
SELECT p.*, s.c_css_styles
FROM app_fd_app_link f 
JOIN app_fd_pages p ON
p.id = f.c_feature_key
left JOIN app_fd_styles s on s.id = p.c_styles
WHERE f.id = ? and f.c_feature_access = 'Public'
```

#### sys.public.page.slug

**Service Key:** `sys.public.page.slug`

**Description:** Retrieves App Link, Pages, Styles records.

**SQL:**

```sql
SELECT p.*, s.c_css_styles
FROM app_fd_app_link f 
JOIN app_fd_pages p ON
p.id = f.c_feature_key
left JOIN app_fd_styles s on s.id = p.c_styles
WHERE f.c_slug = ? and f.c_feature_access = 'Public'
```

#### sys.public.post

**Service Key:** `sys.public.post`

**Description:** Retrieves Post, Styles records.

**SQL:**

```sql
SELECT p.id, p.c_title, p.c_tags, p.c_styles, p.c_staging, p.c_published, p.c_type,
p.c_meta_tags, s.c_css_styles, c_status, p.c_channel_id
FROM app_fd_post p
left JOIN app_fd_styles s on s.id = p.c_styles
where p.id = ? and p.c_type='PUBLIC'
```

#### sys.selected.datalist.sql

**Service Key:** `sys.selected.datalist.sql`

**Description:** Retrieves App Datalist records by ID.

**SQL:**

```sql
select * from app_fd_app_datalist where id  = ?
```

#### sys.selected.dataset.config

**Service Key:** `sys.selected.dataset.config`

**Description:** Retrieves Dataset Config records.

**SQL:**

```sql
select id,c_title,c_config,c_selected_dataset
from app_fd_dataset_config
where c_selected_dataset = ?
```

#### sys.selected.email

**Service Key:** `sys.selected.email`

**Description:** Retrieves Email records by ID.

**SQL:**

```sql
select * from app_fd_email where id = ?
```

#### sys.selected.pivot

**Service Key:** `sys.selected.pivot`

**Description:** Retrieves Pivot Table records by ID.

**SQL:**

```sql
select * from app_fd_pivot_table where id = ?
```

#### sys.site.admin

**Service Key:** `sys.site.admin`

**Description:** Retrieves Directory User, Directory Employment, Associated Site, App Site records.

**SQL:**

```sql
select distinct s.c_channel_id as id, s.c_subscription, s.c_brand_title, s.c_domain
from dir_user u
join dir_employment e on e.userid=u.id
join app_fd_associated_site asite on asite.c_organization_id=e.organizationid
join app_fd_app_site s on s.c_channel_id=asite.c_site_id
where u.username='#currentUser.username#'
```

#### sys.subscription.details

**Service Key:** `sys.subscription.details`

**Description:** Retrieves App Site, Subscription records.

**SQL:**

```sql
SELECT c.*, 'guest' as c_user, 'false' as sub_allow_guest, 'false' as sub_allow_signup, s.c_process_engine, s.c_process_engine_url
FROM app_fd_app_site c join app_fd_subscription s on s.id=c.c_subscription
WHERE c.c_domain = '#HOST_NAME#'
```

#### sys.subscription.process.key

**Service Key:** `sys.subscription.process.key`

**Description:** Retrieves Process Subscription, Process records.

**SQL:**

```sql
select p.c_process_def_key, p.id as p, s.id as s from app_fd_process_subscription  s
join app_fd_process as p on p.id=s.c_process
where p.c_process_def_key=? and s.c_subscription=?
```

#### sys.subscription.site

**Service Key:** `sys.subscription.site`

**Description:** Retrieves App Site, Subscription records.

**SQL:**

```sql
SELECT s.c_process_engine, s.c_process_engine_url, c.*,  'guest' as c_user, 'true' as sub_allow_guest, 'false' as sub_allow_signup
FROM app_fd_app_site c
  JOIN app_fd_subscription s on s.id=c.c_subscription
WHERE c.c_domain = '#HOST_NAME#'
```

#### sys.table.lookup

**Service Key:** `sys.table.lookup`

**Description:** Retrieves PostgreSQL Pg Tables records matching the provided pattern.

**SQL:**

```sql
select tablename from pg_catalog.pg_tables where tablename like ?||'%';
```

#### sys.tenant.emails

**Service Key:** `sys.tenant.emails`

**Description:** Retrieves Email records.

**SQL:**

```sql
SELECT *
FROM app_fd_email where c_type = 'sender'

```

#### sys.tenant.notifications

**Service Key:** `sys.tenant.notifications`

**Description:** Retrieves Notification records ordered in SQL.

**SQL:**

```sql
select * from app_fd_notification
where c_recipientid='#currentUser.username#'
order by datecreated desc
```

#### sys.tenant.subscription

**Service Key:** `sys.tenant.subscription`

**Description:** Retrieves Subscription records by ID.

**SQL:**

```sql
select id, c_lockout_date, c_plan, c_status, c_datasource as tenant_id, c_process_engine,
c_monitor_url, c_monitor_username, c_monitor_password, c_user_limit, c_process_deployment
from app_fd_subscription where id = ?
```

#### sys.user.delegation

**Service Key:** `sys.user.delegation`

**Description:** Retrieves Directory User Replacement records by username.

**SQL:**

```sql
select * 
from dir_user_replacement
where username=?
```

#### sys.user.groups

**Service Key:** `sys.user.groups`

**Description:** Retrieves Directory User, Directory User Group, Directory Group records grouped in SQL.

**SQL:**

```sql
select string_agg(dg.code, ', ') as group_code, string_agg(dg.id, ', ') as groupid from 
dir_user d
join dir_user_group g on g.userid=d.id
join dir_group dg on dg.id = g.groupid
where d.username= '#currentUser.username#'
group by d.id
```

#### sys.user.org.list

**Service Key:** `sys.user.org.list`

**Description:** Retrieves Directory User, Directory Employment, Directory Organization records.

**SQL:**

```sql
select o.id, o.name from 
  dir_user u
  join dir_employment e on e.userid = u.id
  join dir_organization o on o.id=e.organizationid
where u.username='#currentUser.username#'
```

#### sys.user.registration

**Service Key:** `sys.user.registration`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
select * from dir_user
```

#### sys.welcome.post

**Service Key:** `sys.welcome.post`

**Description:** Retrieves Post, Styles records.

**SQL:**

```sql
SELECT p.id, p.c_title, p.c_tags, p.c_styles, p.c_staging, p.c_published,
p.c_meta_tags, s.c_css_styles, c_status, p.c_channel_id, p.c_slug, p.c_type
FROM app_fd_post p
left JOIN app_fd_styles s on s.id = p.c_styles
where p.c_slug = 'get-started'
```

#### tenant.subscription.features

**Service Key:** `tenant.subscription.features`

**Description:** Retrieves Subscription, Subscription Package, Package Feature, Subscription Features records ordered in SQL.

**SQL:**

```sql
select distinct p.id as package_id, p.c_code as package_code, sf.c_code, s.c_status, c_lockout_date 
from app_fd_subscription s
join app_fd_subscription_package p on s.c_package_id=p.id
left join app_fd_subscription_package p1 on p.c_parent like '%'||p1.id||'%'
join app_fd_package_feature pf on pf.c_package_id=p.id or pf.c_package_id=p1.id
join app_fd_subscription_features sf on sf.id = pf.c_feature_id
where s.id=? and s.c_status in ('ACTIVE', 'TRIAL')
  and c_lockout_date::date > now()
order by p.c_code
```

#### user.enc.key

**Service Key:** `user.enc.key`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
select md5(username||'::'||id) from dir_user where username='#currentUser.username#'
```

#### web.content1

**Service Key:** `web.content1`

**Description:** Retrieves App Content records by ID.

**SQL:**

```sql
SELECT c_name, c_layout 
FROM app_fd_app_content 
where id = ?
```

### Module: user-management

#### sys.active.users

**Service Key:** `sys.active.users`

**Description:** Retrieves Directory User records with an aggregate count.

**SQL:**

```sql
select count(id) as active_users from dir_user 
  where active = '1' and username not in ('admin','guest'); 
```

#### sys.associated.sites

**Service Key:** `sys.associated.sites`

**Description:** Retrieves Associated Site records.

**SQL:**

```sql
select * from app_fd_associated_site where c_organization_id =?
```

#### sys.dir.employment

**Service Key:** `sys.dir.employment`

**Description:** Retrieves Directory Employment records.

**SQL:**

```sql
select id, userid from dir_employment where organizationid = ?
```

#### sys.dir.employment.all

**Service Key:** `sys.dir.employment.all`

**Description:** Retrieves Directory Employment records.

**SQL:**

```sql
select id, userid from dir_employment;
```

#### sys.dir.group

**Service Key:** `sys.dir.group`

**Description:** Retrieves Directory Group records.

**SQL:**

```sql
select id, name, description, type, code from dir_group
```

#### sys.dir.group.list

**Service Key:** `sys.dir.group.list`

**Description:** Retrieves Directory Group records.

**SQL:**

```sql
select id, name from dir_group;
```

#### sys.dir.organization

**Service Key:** `sys.dir.organization`

**Description:** Retrieves Directory Organization records.

**SQL:**

```sql
select id, name, city, country from dir_organization;
```

#### sys.dir.role

**Service Key:** `sys.dir.role`

**Description:** Retrieves Directory Role records.

**SQL:**

```sql
select id, name from dir_role;
```

#### sys.dir.selected.organization

**Service Key:** `sys.dir.selected.organization`

**Description:** Retrieves Directory Organization records by ID.

**SQL:**

```sql
select *
from dir_organization
where id = ?
```

#### sys.dir.selected.user

**Service Key:** `sys.dir.selected.user`

**Description:** Retrieves Directory User, Directory User Role, Directory User Group records.

**SQL:**

```sql
SELECT du.id, du.firstname, du.lastname, du.username, du.email, du.password, coalesce(du.provider, 'system') as provider,
du.active, coalesce(ur.roleid,'') as roleid, coalesce(ug.groupid,'') as groupid
FROM dir_user as du
LEFT JOIN dir_user_role as ur
ON ur.userid = du.id
LEFT JOIN dir_user_group as ug
ON  ug.userid = du.id
where du.id = ?;
```

#### sys.dir.user

**Service Key:** `sys.dir.user`

**Description:** Retrieves Directory User, Directory User Group, Directory Group, Directory Employment records grouped in SQL.

**SQL:**

```sql
SELECT e.organizationid, du.id, du.firstname, du.lastname, du.username, du.profile_img,
du.email,  du.active, coalesce(STRING_AGG(g.name,','),'') as user_group, 
coalesce(STRING_AGG(ug.groupid,','),'') as groupid
FROM dir_user as du
LEFT JOIN dir_user_group as ug
ON  ug.userid = du.id
LEFT JOIN dir_group as g
ON  g.id = ug.groupid
left join dir_employment as e
on e.userid = du.id
group by du.id, e.organizationid
```

#### sys.dir.user.group

**Service Key:** `sys.dir.user.group`

**Description:** Retrieves Directory User Group records.

**SQL:**

```sql
select id, userid from dir_user_group;
```

#### sys.dir.user.role

**Service Key:** `sys.dir.user.role`

**Description:** Retrieves Directory User Role records.

**SQL:**

```sql
select id, userid from dir_user_role;
```

#### sys.dir.user.valid

**Service Key:** `sys.dir.user.valid`

**Description:** Retrieves Directory User records by username.

**SQL:**

```sql
select * from dir_user where username=?
```

#### sys.site.administration

**Service Key:** `sys.site.administration`

**Description:** Retrieves App Site, Associated Site records.

**SQL:**

```sql
select a.c_organization_id,s.id, s.c_brand_title, s.c_domain
from app_fd_app_site as s
left join app_fd_associated_site as a
on a.c_site_id = s.id
where s.c_subscription=?
```

## App: Framework

### Module: process-configuration

#### bpm.list.process

**Service Key:** `bpm.list.process`

**Description:** Retrieves Process records ordered in SQL.

**SQL:**

```sql
SELECT *
FROM app_fd_process order by datemodified desc;
```

### Module: process-simulator

#### bpm.list.process

**Service Key:** `bpm.list.process`

**Description:** Retrieves Process records ordered in SQL.

**SQL:**

```sql
SELECT *
FROM app_fd_process order by datemodified desc;
```

### Module: unknows

#### sys.process.config

**Service Key:** `sys.process.config`

**Description:** Retrieves Process Map, Process, App Form, Process Category, Directory User records.

**SQL:**

```sql
SELECT distinct pm.id, pm.c_process_key, pm.c_hide_inbox_start, pm.c_allow_draft
FROM app_fd_process_map AS pm
join app_fd_process p on p.c_process_def_key=pm.c_process_key
JOIN app_fd_app_form AS af ON
af.id = pm.c_form_id
JOIN app_fd_process_category AS pc ON
pc.c_key = pm.c_category
join dir_user u on u.username='#currentUser.username#'
```

## App: framework (Asset Image uploader)

### Module: content-management

#### list.image.assets

**Service Key:** `list.image.assets`

**Description:** Retrieves Assets records for a channel, ordered in SQL.

**SQL:**

```sql
select id, c_title, c_dimensions, c_image, c_folder_id
from app_fd_assets
WHERE c_channel_id = ? and c_folder_id = ?
ORDER BY datemodified DESC;
```

## App: framework (For Content Desginer)

### Module: content-management

#### list.image.assets.viewer

**Service Key:** `list.image.assets.viewer`

**Description:** Retrieves Assets records for a channel, ordered in SQL.

**SQL:**

```sql
select id, c_title, c_dimensions, c_image, c_folder_id
from app_fd_assets
WHERE c_channel_id = ?
ORDER BY datemodified DESC;
```

## App: framework (Listing Folders in Image Manager)

### Module: content-management

#### list.image.folders

**Service Key:** `list.image.folders`

**Description:** Retrieves Assets Folder records for a channel, ordered in SQL.

**SQL:**

```sql
select * from app_fd_assets_folder where c_channel_id = ? and c_parent = ?
ORDER BY c_title;
```

## App: framework app

### Module: content-management

#### sys.app.builder.export.authorizations

**Service Key:** `sys.app.builder.export.authorizations`

**Description:** Retrieves Authorization records.

**SQL:**

```sql
select * from app_fd_authorization
```

#### sys.app.builder.export.datalists

**Service Key:** `sys.app.builder.export.datalists`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select * from app_fd_app_datalist
```

#### sys.app.builder.export.forms

**Service Key:** `sys.app.builder.export.forms`

**Description:** Retrieves App Form records.

**SQL:**

```sql
select * from app_fd_app_form
```

#### sys.app.builder.export.menus

**Service Key:** `sys.app.builder.export.menus`

**Description:** Retrieves App Menu records.

**SQL:**

```sql
select * from app_fd_app_menu
```

#### sys.app.builder.export.pages

**Service Key:** `sys.app.builder.export.pages`

**Description:** Retrieves Pages records.

**SQL:**

```sql
select * from app_fd_pages
```

## App: framework.app

### Module: content-management

#### sys.app.builder.menus

**Service Key:** `sys.app.builder.menus`

**Description:** Retrieves App Menu records.

**SQL:**

```sql
select id, c_name from app_fd_app_menu
```

### Module: unknows

#### sys.app.builder.authorization

**Service Key:** `sys.app.builder.authorization`

**Description:** Retrieves Authorization records.

**SQL:**

```sql
select id, c_title as c_name from app_fd_authorization
```

#### sys.app.builder.datalist

**Service Key:** `sys.app.builder.datalist`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id, c_name, c_db_column from app_fd_app_datalist
```

#### sys.app.builder.pages

**Service Key:** `sys.app.builder.pages`

**Description:** Retrieves Pages records.

**SQL:**

```sql
select id, c_name from app_fd_pages
```

## App: framwork

### Module: camunda

#### bpm.list.all.users

**Service Key:** `bpm.list.all.users`

**Description:** Retrieves Directory User records.

**SQL:**

```sql
SELECT id, firstname, lastname, username,
firstname ||' '|| lastname AS fullname,
firstname ||' '|| lastname||' ( '|| username ||' )'  AS displayname, profile_img
FROM dir_user;
```

## App: graph

### Module: unknows

#### graph.test

**Service Key:** `graph.test`

**Description:** Retrieves Api Service records with an aggregate count, grouped in SQL, ordered in SQL.

**SQL:**

```sql
select to_char(datecreated::date, 'Dy') as date, 
count(id) as current_week, count(id)-2 as last_week
from app_fd_api_service a
group by a.datecreated::date
order by a.datecreated::date
```

## App: PE

### Module: process-configuration

#### pe.datalist

**Service Key:** `pe.datalist`

**Description:** Retrieves App Datalist records.

**SQL:**

```sql
select id from app_fd_app_datalist
where c_db_column =?
```

### Module: unknows

#### pe.list.process

**Service Key:** `pe.list.process`

**Description:** Retrieves Process records.

**SQL:**

```sql
select p.bpmn_process_id_ as id, p.key_ as c_key, p.version_ as c_version, TO_CHAR(TO_TIMESTAMP(p.TIMESTAMP_ / 1000), 'YYYY-MM-DD HH24:MI:SS') as date_deployed
from process p
where bpmn_process_id_ like '#HOST_DB#_'||?||'%'
```

## App: seo

### Module: unknows

#### post.content

**Service Key:** `post.content`

**Description:** Retrieves Post, Styles records.

**SQL:**

```sql
SELECT p.id, p.c_title, p.c_published as c_content, p.c_published, p.c_tags, p.c_styles, s.c_css_styles, p.c_tags,p.c_meta_tags
FROM app_fd_post p 
LEFT JOIN app_fd_styles s on s.id = p.c_styles
where p.c_slug = ?
```

#### site.map

**Service Key:** `site.map`

**Description:** Retrieves App Content, Post records.

**SQL:**

```sql
SELECT c.id, c.datemodified, 'content' AS content_type, c.c_name, c.c_slug
FROM app_fd_app_content c WHERE c.c_status='PUBLISHED' and c.c_type='PUBLIC' and c.c_channel='#CHANNEL_ID#'
UNION 
SELECT p.id, p.datemodified, 'post' AS content_type, c_title as c_name, p.c_slug
FROM app_fd_post p where p.c_type='PUBLIC' and p.c_status='PUBLISHED' and p.c_channel_id='#CHANNEL_ID#'
```

#### web.content

**Service Key:** `web.content`

**Description:** Retrieves App Content records.

**SQL:**

```sql
SELECT c_name as c_title, c_tags,c_meta_tags, c_description, c_published  as c_layout
FROM app_fd_app_content 
where c_slug=?
```

## App: subscription

### Module: payment-processor

#### subscription.package.features

**Service Key:** `subscription.package.features`

**Description:** Retrieves Package Feature, Subscription Features records.

**SQL:**

```sql
select f.*, p.c_package_id from app_fd_package_feature p 
join app_fd_subscription_features f on f.id = p.c_feature_id
where f.c_type is null or f.c_type='Standard'
```

#### subscription.package.services

**Service Key:** `subscription.package.services`

**Description:** Retrieves Subscription Services records.

**SQL:**

```sql
select * from app_fd_subscription_services
```

#### subscription.packages

**Service Key:** `subscription.packages`

**Description:** Retrieves Subscription Package records ordered in SQL.

**SQL:**

```sql
select * from app_fd_subscription_package where c_type='Standard' order by c_code
```

#### tenant.subscription

**Service Key:** `tenant.subscription`

**Description:** Retrieves Subscription records by ID.

**SQL:**

```sql
select * from app_fd_subscription where id = ?
```

### Module: subscription

#### subscription.package.features

**Service Key:** `subscription.package.features`

**Description:** Retrieves Package Feature, Subscription Features records.

**SQL:**

```sql
select f.*, p.c_package_id from app_fd_package_feature p 
join app_fd_subscription_features f on f.id = p.c_feature_id
where f.c_type is null or f.c_type='Standard'
```

#### subscription.package.services

**Service Key:** `subscription.package.services`

**Description:** Retrieves Subscription Services records.

**SQL:**

```sql
select * from app_fd_subscription_services
```

#### subscription.packages

**Service Key:** `subscription.packages`

**Description:** Retrieves Subscription Package records ordered in SQL.

**SQL:**

```sql
select * from app_fd_subscription_package where c_type='Standard' order by c_code
```

#### tenant.subscription

**Service Key:** `tenant.subscription`

**Description:** Retrieves Subscription records by ID.

**SQL:**

```sql
select * from app_fd_subscription where id = ?
```

## App: unknown

### Module: unknows

#### sys.email.history

**Service Key:** `sys.email.history`

**Description:** Retrieves Email records.

**SQL:**

```sql
select * from app_fd_email
where c_reply_to = ? and c_type = 'reciever'
```

#### sys.site.lading.content

**Service Key:** `sys.site.lading.content`

**Description:** Retrieves App Content records.

**SQL:**

```sql
select p.id, p.c_name, p.c_meta_tags 
from app_fd_app_content p 
where p.id = ?
```

#### sys.site.landing.page

**Service Key:** `sys.site.landing.page`

**Description:** Retrieves App Site records.

**SQL:**

```sql
select s.c_home_page, s.c_landing_page from app_fd_app_site s
where s.c_domain = '#HOST_NAME#'
```

## App: whatsapp

### Module: unknows

#### chat.list.chats

**Service Key:** `chat.list.chats`

**Description:** Retrieves Chats records.

**SQL:**

```sql
select * from app_fd_chats
```

#### chat.list.contacts

**Service Key:** `chat.list.contacts`

**Description:** Retrieves Chat Contacts records.

**SQL:**

```sql
select * from app_fd_chat_contacts
```

#### chat.list.messages

**Service Key:** `chat.list.messages`

**Description:** Retrieves Chat Messages records.

**SQL:**

```sql
select * from app_fd_chat_messages where c_chatid=?
```

#### chat.list.team.members

**Service Key:** `chat.list.team.members`

**Description:** Retrieves Chat Team Members records.

**SQL:**

```sql
select * from app_fd_chat_team_members where c_teamid=?
```

#### chat.list.teams

**Service Key:** `chat.list.teams`

**Description:** Retrieves Chat Teams records.

**SQL:**

```sql
select * from app_fd_chat_teams
```
