def my_cron_job():
	print('iam an cron job')
	f = open('/app/cronjob.txt', 'a')
	f.write('iam an cron job')
	f.close()
