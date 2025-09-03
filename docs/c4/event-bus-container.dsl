workspace "Scheduling Platform" "C4 Container View: Event Bus with SNS + SQS" {
  model {
    person team "Engineering Team" "Builds & operates services"

    softwareSystem scheduling "Scheduling Platform" {
      container api "API Gateway / Backend" "Node/Java" "Issues domain events"
      container db "Operational DB" "PostgreSQL" "OLTP store"

      container sns "SNS Topic" "AWS SNS" "Fan-out for domain events"
      container sqsBilling "Billing Queue" "AWS SQS (FIFO)" "Billing service consumer"
      container sqsAudit "Audit Queue" "AWS SQS" "Audit trail consumer"
      container sqsNotify "Notify Queue" "AWS SQS" "Notifications consumer"

      container billing "Billing Service" "Java/.NET" "Consumes billing events"
      container audit "Audit Service" "Python/Go" "Consumes audit events"
      container notify "Notification Service" "Node" "Sends user notifications"

      team -> api "Deploys & maintains"
      api -> sns "Publishes events" "HTTPS (SigV4), TLS"
      sns -> sqsBilling "Fan-out"
      sns -> sqsAudit "Fan-out"
      sns -> sqsNotify "Fan-out"
      sqsBilling -> billing "Delivers messages"
      sqsAudit -> audit "Delivers messages"
      sqsNotify -> notify "Delivers messages"
      api -> db "Reads/Writes" "TLS"
    }
  }

  views {
    container scheduling "container" {
      include *
      autolayout lr
      title "C4 — Container View: Event Bus with SNS + SQS"
    }
    theme default
  }
}
