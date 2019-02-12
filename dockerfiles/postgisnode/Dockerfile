FROM mdillon/postgis:11

RUN apt-get update \
 && apt-get install -y --force-yes --no-install-recommends \
      apt-transport-https \
      build-essential \
      curl \
      ca-certificates \
      git \
      lsb-release \
      python-all \
      rlwrap \
 && apt-get clean \
 && apt-get autoremove \
 && rm -rf /var/lib/apt/lists

# Using Ubuntu
#curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash sudo apt-get install -y nodejs

# Using Debian, as root
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash
RUN apt-get install -y nodejs

CMD ["postgres"]

