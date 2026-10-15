# System Workflow & UI Flow Diagram

This document defines the strict workflow and UI flow for the Company Management System, structured into three distinct panels. Responsibilities are assigned based on the "Arrow-Based Flow Rule": **The element where the arrow ends owns the action.**

## Arrow-Based Responsibility Rules

1.  **Attendance**: Employee (Automated) $\rightarrow$ HR (Verify). **HR is responsible for Verification.** Admin only views.
2.  **Project Assignment**: Project Head $\rightarrow$ Employee (Acknowledge). **Project Head Assigns**, **Employee Acknowledges.**
3.  **Reporting**: Employee $\rightarrow$ Admin (View). **Admin Views Only.**
4.  **Operational Tasks**: Admin does **NOT** execute operational tasks. Admin is for Monitoring & Viewing.

## Panel Structure

### 1. Admin Panel
*Context*: Super Admin / Admin User.
*Role*: Viewing & Monitoring.

| Module | Direction / Source | Responsibility (Admin) |
| :--- | :--- | :--- |
| **Attendance** | $\leftarrow$ From HR (Verified Data) | **View Only**. Monitor check-in/out times. |
| **Daily Activity** | $\leftarrow$ From Employee | **View Only**. Check daily reports. |
| **Weekly Assessments** | $\leftarrow$ From Employee Data | **View Only**. Analyze weekly performance. |
| **Projects** | $\leftarrow$ From Project Head | **View Only**. Monitor project status. |
| **HR Data** | $\leftarrow$ From HR | **View Only**. Monitor HR stats. |

> **Strict Rule**: Admin does **NOT** verify attendance or assign projects.

---

### 2. Manager Panel
*Context*: Login-Based Dynamic View. No standalone "Manager" role.

#### A. Login as HR
*Role*: Operational / Verification.

| Module | Direction | Responsibility (HR) |
| :--- | :--- | :--- |
| **Attendance** | $\leftarrow$ From Employee (System) | **Verify**. HR confirms attendance status (Present/Absent/Excused). |
| **Letters & Docs** | $\rightarrow$ To Employee | **Issue**. HR handles Warning Letters, Joining Docs. |
| **Employee Records** | $\leftrightarrow$ Internal | **Manage**. HR maintains employee database. |

#### B. Login as Project Head
*Role*: Operational / Assignment.

| Module | Direction | Responsibility (Project Head) |
| :--- | :--- | :--- |
| **Projects** | $\rightarrow$ To Employee | **Assign**. Project Head creates and allocates projects. |
| **Project Progress** | $\leftarrow$ From Employee | **Track**. Project Head monitors task completion. |

> **Note**: Marketing and Finance modules are **completely removed**.

---

### 3. Employee Panel
*Context*: General Staff.
*Role*: Execution / Submission.

| Module | Direction | Responsibility (Employee) |
| :--- | :--- | :--- |
| **Attendance** | $\rightarrow$ To System/HR | **Automated**. System logs time; Employee views own history. |
| **Daily Activity** | $\rightarrow$ To Admin | **Submit**. Employee logs daily tasks/reports. |
| **Projects** | $\leftarrow$ From Project Head | **Acknowledge**. Employee views and updates assigned tasks. |
| **Weekly Assessment** | $\rightarrow$ To Admin | **Appear**. Data aggregates into weekly assessments. |

---

## Visual Flow Diagram

```mermaid
flowchart TD
    %% Nodes
    subgraph Panel_1_Admin ["Panel 1: Admin Panel (View Only)"]
        direction TB
        Admin[Admin User]
        AdminViewAtt[View Attendance]
        AdminViewRep[View Reports]
        AdminViewProj[View Projects]
        AdminViewAssess[View Weekly Assessment]
    end

    subgraph Panel_2_Manager ["Panel 2: Manager Panel"]
        direction TB
        
        subgraph Login_HR ["Login: HR"]
            HR[HR User]
            HRVerify[Verify Attendance]
            HRDocs[Manage Letters/Docs]
        end

        subgraph Login_PH ["Login: Project Head"]
            PH[Project Head]
            PHAssign[Assign Projects]
            PHTrack[Track Progress]
        end
    end

    subgraph Panel_3_Employee ["Panel 3: Employee Panel"]
        direction TB
        Emp[Employee]
        EmpAutoAtt[Automated Attendance]
        EmpDaily[Submit Daily Activity]
        EmpTask[Acknowledge Project]
    end

    %% STRICT ARROW RULES

    %% 1. Attendance: Employee -> HR (Verify) -> Admin (View)
    EmpAutoAtt -->|Data Flow| HRVerify
    HRVerify -->|Verified Data| AdminViewAtt

    %% 2. Projects: PH (Assign) -> Employee (Ack) -> PH (Track) -> Admin (View)
    PHAssign -->|Assigns| EmpTask
    EmpTask -->|Updates Status| PHTrack
    PHTrack -->|Status Report| AdminViewProj

    %% 3. Reports: Employee (Submit) -> Admin (View)
    EmpDaily -->|Direct Submission| AdminViewRep
    
    %% 4. Assessments: Employee Data -> Admin (View)
    Emp -->|Performance Data| AdminViewAssess

    %% 5. HR Docs: HR -> Employee (Implicit View, not detailed in prompt but implied ownership)
    HRDocs -.-> Emp

    %% Styles
    classDef admin fill:#f9f,stroke:#333,stroke-width:2px;
    classDef hr fill:#bbf,stroke:#333,stroke-width:2px;
    classDef ph fill:#bfb,stroke:#333,stroke-width:2px;
    classDef emp fill:#ff9,stroke:#333,stroke-width:2px;

    class Admin,AdminViewAtt,AdminViewRep,AdminViewProj,AdminViewAssess admin;
    class HR,HRVerify,HRDocs hr;
    class PH,PHAssign,PHTrack ph;
    class Emp,EmpAutoAtt,EmpDaily,EmpTask emp;
```
