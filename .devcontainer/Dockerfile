# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.238.0/containers/java/.devcontainer/base.Dockerfile

# [Choice] Java version (use -bullseye variants on local arm64/Apple Silicon): 11, 17, 11-bullseye, 17-bullseye, 11-buster, 17-buster
ARG VARIANT="17-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/java:0-${VARIANT}

# [Option] Install Maven
ARG INSTALL_MAVEN="false"
ARG MAVEN_VERSION=""
# [Option] Install Gradle
ARG INSTALL_GRADLE="false"
ARG GRADLE_VERSION=""

# [Option] Install Gradle
ARG INSTALL_GRAALVM="false"
ARG GRAALVM_VERSION="22.1.0"

RUN if [ "${INSTALL_MAVEN}" = "true" ]; then su vscode -c "umask 0002 && . /usr/local/sdkman/bin/sdkman-init.sh && sdk install maven \"${MAVEN_VERSION}\""; fi \
    && if [ "${INSTALL_GRADLE}" = "true" ]; then su vscode -c "umask 0002 && . /usr/local/sdkman/bin/sdkman-init.sh && sdk install gradle \"${GRADLE_VERSION}\""; fi

# Added custom Gradle install instructions
RUN if [ "${INSTALL_GRAALVM}" = "true" ]; then su vscode -c "umask 0002 && wget https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${GRAALVM_VERSION}/graalvm-ce-java11-linux-amd64-${GRAALVM_VERSION}.tar.gz -P /home/vscode"; fi
RUN if [ "${INSTALL_GRAALVM}" = "true" ]; then tar -xvzf /home/vscode/graalvm-ce-java11-linux-amd64-${GRAALVM_VERSION}.tar.gz -C /home/vscode; fi
RUN if [ "${INSTALL_GRAALVM}" = "true" ]; then su vscode -c "umask 0002 && rm /home/vscode/graalvm-ce-java11-linux-amd64-${GRAALVM_VERSION}.tar.gz"; fi

ENV GRAALVM_HOME="/home/vscode/graalvm-ce-java11-${GRAALVM_VERSION}"

RUN if [ "${INSTALL_GRAALVM}" = "true" ]; then ${GRAALVM_HOME}/bin/gu install native-image; fi
#     && if [ "${INSTALL_GRAALVM}" = "true" ]; then su vscode -c "umask 0002 && tar -xvzf /home/vscode/graalvm-ce-java11-linux-amd64-\"${GRAALVM_VERSION}\".tar.gz && rm /home/vscode/graalvm-ce-java11-linux-amd64-\"${GRAALVM_VERSION}\".tar.gz && /graalvm-ce-java11-linux-amd64-\"${GRAALVM_VERSION}\"/bin/gu install native-image"; fi


# [Choice] Node.js version: none, lts/*, 16, 14, 12, 10
ARG NODE_VERSION="none"
RUN if [ "${NODE_VERSION}" != "none" ]; then su vscode -c "umask 0002 && . /usr/local/share/nvm/nvm.sh && nvm install ${NODE_VERSION} 2>&1"; fi

# Manually added to add quarkus-cli to command line as an option
RUN su vscode -c "curl -Ls https://sh.jbang.dev | bash -s - trust add https://repo1.maven.org/maven2/io/quarkus/quarkus-cli/";
RUN su vscode -c "curl -Ls https://sh.jbang.dev | bash -s - app install --fresh --force quarkus@quarkusio";

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment this line to install global node packages.
# RUN su vscode -c "source /usr/local/share/nvm/nvm.sh && npm install -g <your-package-here>" 2>&1