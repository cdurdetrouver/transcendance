from django.http import HttpResponse

def return_literal_string(request):
    return HttpResponse("Cdurdetrouver", content_type="text/plain")
