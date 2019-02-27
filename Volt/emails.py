from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail.email import Email
from sendgrid.helpers.mail.content import Content
from sendgrid.helpers.mail.mail import Mail
from agisvolt.settings import SENDGRID_API_KEY


class SendEmail:
    client = SendGridAPIClient(api_key=SENDGRID_API_KEY).client
    sender = Email('api@agis.fi')

    def __init__(self, to):
        self._to = Email(to)
        self._subject = 'No subject'
        self._content = Content('text/plain', '')

    def send(self):
        mail = Mail(self.sender, self._subject, self._to, self._content)
        self.client.mail.send.post(request_body=mail.get())
